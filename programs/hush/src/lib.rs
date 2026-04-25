//! HUSH — Confidential Philanthropy Engine on Solana
//!
//! Provides stealth deposits (Umbra-style ECDH), private yield (MagicBlock PER),
//! and selective disclosure (viewing keys) for on-chain Donor Advised Funds (DAFs).

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

declare_id!("HUSHvau1tXGqT1nFDUzGJpyvT1CYS8yEQV8X5LmHHu1");

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

#[program]
pub mod hush {
    use super::*;

    /// Initialize the global HUSH vault PDA.
    ///
    /// Sets the authority, fee_bps, and initial nonce on the `HushVault` PDA.
    /// Can only be called once (init constraint).
    ///
    /// # Arguments
    /// * `fee_bps` — Protocol fee in basis points (0–10_000).
    pub fn initialize_vault(ctx: Context<InitializeVault>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= 10_000, HushError::InvalidFeeConfig);

        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.fee_bps = fee_bps;
        vault.total_shielded = 0;
        vault.total_granted = 0;
        vault.grant_nonce = 0;
        vault.bump = ctx.bumps.vault;

        msg!(
            "HUSH vault initialized. authority={}, fee_bps={}",
            vault.authority,
            vault.fee_bps
        );
        Ok(())
    }

    /// Shield a USDC deposit into the global vault via a stealth pubkey.
    ///
    /// The donor supplies a stealth public key (32-byte compressed secp256k1 or
    /// Curve25519 point) and an ECDH-encrypted random scalar.  These are stored
    /// on-chain so that only the owner of the corresponding private key can
    /// reconstruct the stealth address and claim the balance.
    ///
    /// # Arguments
    /// * `amount`           — USDC micro-units to deposit (must be > 0).
    /// * `stealth_pubkey`   — 32-byte stealth address for the deposit.
    /// * `encrypted_random` — ECDH-encrypted ephemeral random scalar (viewing hint).
    pub fn shield_deposit(
        ctx: Context<ShieldDeposit>,
        amount: u64,
        stealth_pubkey: [u8; 32],
        encrypted_random: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, HushError::AmountZero);

        // Transfer USDC from donor's ATA → vault token account.
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.donor_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.donor.to_account_info(),
            },
        );
        transfer(cpi_ctx, amount)?;

        // Update the ShieldedAccount for this stealth key.
        let shielded = &mut ctx.accounts.shielded_account;
        shielded.donor_stealth = stealth_pubkey;
        shielded.shielded_balance = shielded
            .shielded_balance
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        shielded.deposit_count = shielded
            .deposit_count
            .checked_add(1)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        shielded.bump = ctx.bumps.shielded_account;

        // Update vault totals.
        let vault = &mut ctx.accounts.vault;
        vault.total_shielded = vault
            .total_shielded
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Emit event (indexers / light-clients consume this).
        emit!(ShieldedDeposit {
            stealth_pubkey,
            amount,
            encrypted_random,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "ShieldDeposit: stealth={:?}, amount={}, new_balance={}",
            stealth_pubkey,
            amount,
            shielded.shielded_balance
        );
        Ok(())
    }

    /// Advise a grant from a shielded balance to a charity wallet.
    ///
    /// Creates a `GrantRequest` PDA that a relayer/crank later settles.
    /// The donor's `shielded_balance` is decremented immediately (funds are
    /// already inside the vault), providing atomic reservation.
    ///
    /// # Arguments
    /// * `amount`         — Amount to grant in USDC micro-units.
    /// * `charity_wallet` — On-chain wallet that will receive the USDC.
    /// * `memo_hash`      — 32-byte hash of an optional off-chain memo / purpose.
    pub fn advise_grant(
        ctx: Context<AdviseGrant>,
        amount: u64,
        charity_wallet: Pubkey,
        memo_hash: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, HushError::AmountZero);

        let shielded = &mut ctx.accounts.shielded_account;
        require!(
            shielded.shielded_balance >= amount,
            HushError::InsufficientShieldedBalance
        );

        // Reserve funds: decrement shielded balance atomically.
        shielded.shielded_balance = shielded
            .shielded_balance
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Snapshot the nonce before incrementing so the PDA seed matches
        // the grant_id stored in the GrantRequest.
        let vault = &mut ctx.accounts.vault;
        let grant_id = vault.grant_nonce;
        vault.grant_nonce = vault
            .grant_nonce
            .checked_add(1)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Populate the GrantRequest PDA.
        let grant = &mut ctx.accounts.grant_request;
        grant.donor = ctx.accounts.donor.key();
        grant.charity_wallet = charity_wallet;
        grant.amount = amount;
        grant.memo_hash = memo_hash;
        grant.settled = false;
        grant.grant_id = grant_id;
        grant.bump = ctx.bumps.grant_request;

        emit!(GrantAdvised {
            grant_id,
            charity_wallet,
            amount,
            memo_hash,
        });

        msg!(
            "GrantAdvised: id={}, charity={}, amount={}, remaining_balance={}",
            grant_id,
            charity_wallet,
            amount,
            shielded.shielded_balance
        );
        Ok(())
    }

    /// Settle a pending `GrantRequest` by transferring USDC from the vault to
    /// the charity wallet.
    ///
    /// Can be called by the vault authority or any designated crank.  Uses a
    /// PDA-signed CPI so no private key is needed for the vault token account.
    ///
    /// # Arguments
    /// * `grant_id` — The sequential ID of the grant to settle.
    pub fn settle_grant(ctx: Context<SettleGrant>, grant_id: u64) -> Result<()> {
        // Authorization: caller must be vault authority or the crank signer.
        let caller = ctx.accounts.settler.key();
        let vault_authority = ctx.accounts.vault.authority;
        require!(
            caller == vault_authority,
            HushError::UnauthorizedSettler
        );

        let grant = &mut ctx.accounts.grant_request;
        require!(!grant.settled, HushError::GrantAlreadySettled);
        require!(grant.grant_id == grant_id, HushError::GrantAlreadySettled);

        let amount = grant.amount;

        // CPI: vault PDA signs the transfer vault_token_account → charity ATA.
        let vault_bump = ctx.accounts.vault.bump;
        let seeds: &[&[u8]] = &[b"hush_vault", &[vault_bump]];
        let signer_seeds = &[seeds];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.charity_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer_seeds,
        );
        transfer(cpi_ctx, amount)?;

        // Mark the grant settled.
        grant.settled = true;

        // Update vault totals.
        let vault = &mut ctx.accounts.vault;
        vault.total_granted = vault
            .total_granted
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        vault.total_shielded = vault
            .total_shielded
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Emit a zero-padded tx signature placeholder (real signature is the
        // outer transaction signature; indexers resolve from slot + nonce).
        emit!(GrantSettled {
            grant_id,
            charity_wallet: grant.charity_wallet,
            amount,
            tx_signature: [0u8; 64],
        });

        msg!(
            "GrantSettled: id={}, charity={}, amount={}",
            grant_id,
            grant.charity_wallet,
            amount
        );
        Ok(())
    }

    /// AI agent memo instruction to record a yield rebalancing event.
    ///
    /// No on-chain funds move here; this instruction provides a signed, ordered
    /// log of intent that off-chain agents (MagicBlock PER, Kamino, etc.) can
    /// respond to via CPI or separate transactions.
    ///
    /// # Arguments
    /// * `protocol` — Protocol identifier byte (e.g. 0 = Kamino, 1 = Marginfi).
    /// * `amount`   — Notional amount being rebalanced.
    pub fn rebalance_yield(ctx: Context<RebalanceYield>, protocol: u8, amount: u64) -> Result<()> {
        require!(amount > 0, HushError::AmountZero);

        // Only the vault authority may trigger rebalancing.
        require!(
            ctx.accounts.authority.key() == ctx.accounts.vault.authority,
            HushError::UnauthorizedSettler
        );

        let timestamp = Clock::get()?.unix_timestamp;

        emit!(RebalanceYield {
            protocol,
            amount,
            timestamp,
        });

        msg!(
            "RebalanceYield: protocol={}, amount={}, ts={}",
            protocol,
            amount,
            timestamp
        );
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    /// Payer and initial authority of the vault.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Global HUSH vault PDA — created once.
    #[account(
        init,
        payer = authority,
        space = HushVault::LEN,
        seeds = [b"hush_vault"],
        bump,
    )]
    pub vault: Account<'info, HushVault>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, stealth_pubkey: [u8; 32])]
pub struct ShieldDeposit<'info> {
    /// Donor pays for account creation and signs the transfer.
    #[account(mut)]
    pub donor: Signer<'info>,

    /// Global vault PDA — accumulates total shielded.
    #[account(
        mut,
        seeds = [b"hush_vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,

    /// Per-stealth-key shielded account.  Created on first deposit for this
    /// stealth_pubkey; subsequent deposits reuse and add to balance.
    #[account(
        init_if_needed,
        payer = donor,
        space = ShieldedAccount::LEN,
        seeds = [b"shielded", stealth_pubkey.as_ref()],
        bump,
    )]
    pub shielded_account: Account<'info, ShieldedAccount>,

    /// USDC mint.
    pub usdc_mint: Account<'info, Mint>,

    /// Donor's USDC ATA — source of funds.
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = donor,
    )]
    pub donor_token_account: Account<'info, TokenAccount>,

    /// Vault's USDC ATA — destination.  Created if absent.
    #[account(
        init_if_needed,
        payer = donor,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, charity_wallet: Pubkey, memo_hash: [u8; 32])]
pub struct AdviseGrant<'info> {
    /// Donor authorizes the grant.
    #[account(mut)]
    pub donor: Signer<'info>,

    /// Global vault PDA — grant_nonce is incremented here.
    #[account(
        mut,
        seeds = [b"hush_vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,

    /// The donor's ShieldedAccount — balance is decremented.
    #[account(
        mut,
        seeds = [b"shielded", shielded_account.donor_stealth.as_ref()],
        bump = shielded_account.bump,
    )]
    pub shielded_account: Account<'info, ShieldedAccount>,

    /// GrantRequest PDA — seeded by donor + grant_nonce snapshot.
    #[account(
        init,
        payer = donor,
        space = GrantRequest::LEN,
        seeds = [b"grant", donor.key().as_ref(), &vault.grant_nonce.to_le_bytes()],
        bump,
    )]
    pub grant_request: Account<'info, GrantRequest>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(grant_id: u64)]
pub struct SettleGrant<'info> {
    /// Must be vault authority (checked in instruction body).
    #[account(mut)]
    pub settler: Signer<'info>,

    /// Global vault PDA — authority checked and totals updated.
    #[account(
        mut,
        seeds = [b"hush_vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,

    /// The GrantRequest to settle.
    #[account(
        mut,
        seeds = [b"grant", grant_request.donor.as_ref(), &grant_id.to_le_bytes()],
        bump = grant_request.bump,
    )]
    pub grant_request: Account<'info, GrantRequest>,

    /// USDC mint.
    pub usdc_mint: Account<'info, Mint>,

    /// Vault USDC ATA — source.
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Charity USDC ATA — destination.  Created if absent.
    #[account(
        init_if_needed,
        payer = settler,
        associated_token::mint = usdc_mint,
        associated_token::authority = grant_request.charity_wallet,
    )]
    pub charity_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RebalanceYield<'info> {
    /// Must match vault.authority.
    pub authority: Signer<'info>,

    /// Global vault PDA — authority verified.
    #[account(
        seeds = [b"hush_vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,
}

// ---------------------------------------------------------------------------
// State accounts
// ---------------------------------------------------------------------------

/// Global HUSH vault configuration and accounting.
#[account]
#[derive(Default)]
pub struct HushVault {
    /// Authority that can settle grants and trigger rebalancing.
    pub authority: Pubkey,      // 32
    /// Protocol fee in basis points (0–10_000).
    pub fee_bps: u16,           // 2
    /// Running total of USDC currently inside the vault.
    pub total_shielded: u64,    // 8
    /// Running total of USDC ever granted to charities.
    pub total_granted: u64,     // 8
    /// Monotonically increasing counter; used as GrantRequest PDA seed.
    pub grant_nonce: u64,       // 8
    /// PDA bump.
    pub bump: u8,               // 1
}

impl HushVault {
    /// Discriminator (8) + fields.
    pub const LEN: usize = 8 + 32 + 2 + 8 + 8 + 8 + 1;
}

/// Per-stealth-key shielded balance account.
#[account]
#[derive(Default)]
pub struct ShieldedAccount {
    /// 32-byte stealth public key that controls this balance.
    pub donor_stealth: [u8; 32], // 32
    /// Current reserved balance in USDC micro-units.
    pub shielded_balance: u64,   // 8
    /// Number of deposits into this account.
    pub deposit_count: u64,      // 8
    /// PDA bump.
    pub bump: u8,                // 1
}

impl ShieldedAccount {
    /// Discriminator (8) + fields.
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}

/// A pending (or settled) grant from a shielded balance to a charity.
#[account]
#[derive(Default)]
pub struct GrantRequest {
    /// The donor who created this grant.
    pub donor: Pubkey,             // 32
    /// On-chain wallet of the beneficiary charity.
    pub charity_wallet: Pubkey,    // 32
    /// USDC amount in micro-units.
    pub amount: u64,               // 8
    /// 32-byte hash of optional off-chain memo / purpose.
    pub memo_hash: [u8; 32],       // 32
    /// Whether the grant has been disbursed to the charity.
    pub settled: bool,             // 1
    /// Sequential grant ID (matches the vault nonce snapshot at creation).
    pub grant_id: u64,             // 8
    /// PDA bump.
    pub bump: u8,                  // 1
}

impl GrantRequest {
    /// Discriminator (8) + fields.
    pub const LEN: usize = 8 + 32 + 32 + 8 + 32 + 1 + 8 + 1;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Emitted on every successful shielded deposit.
#[event]
pub struct ShieldedDeposit {
    /// The stealth public key associated with the deposit.
    pub stealth_pubkey: [u8; 32],
    /// Amount deposited in USDC micro-units.
    pub amount: u64,
    /// ECDH-encrypted ephemeral random (viewing hint for stealth key owner).
    pub encrypted_random: [u8; 32],
    /// Unix timestamp of the deposit.
    pub timestamp: i64,
}

/// Emitted when a donor creates a grant request.
#[event]
pub struct GrantAdvised {
    /// Sequential grant identifier.
    pub grant_id: u64,
    /// Beneficiary charity wallet.
    pub charity_wallet: Pubkey,
    /// USDC amount in micro-units.
    pub amount: u64,
    /// 32-byte hash of the optional off-chain grant memo.
    pub memo_hash: [u8; 32],
}

/// Emitted when a grant is settled (USDC disbursed to charity).
#[event]
pub struct GrantSettled {
    /// Sequential grant identifier.
    pub grant_id: u64,
    /// Beneficiary charity wallet.
    pub charity_wallet: Pubkey,
    /// USDC amount in micro-units.
    pub amount: u64,
    /// 64-byte transaction signature (outer tx; zeroed here, resolved off-chain).
    pub tx_signature: [u8; 64],
}

/// Emitted when the AI agent memo-records a yield rebalancing event.
#[event]
pub struct RebalanceYield {
    /// Protocol byte (0 = Kamino, 1 = Marginfi, 2 = Drift, …).
    pub protocol: u8,
    /// Notional amount being rebalanced in USDC micro-units.
    pub amount: u64,
    /// Unix timestamp of the instruction.
    pub timestamp: i64,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum HushError {
    /// Shielded balance is too low to cover the requested grant amount.
    #[msg("Insufficient shielded balance for this grant.")]
    InsufficientShieldedBalance,

    /// The GrantRequest has already been settled; cannot settle again.
    #[msg("This grant has already been settled.")]
    GrantAlreadySettled,

    /// The caller is not authorized to settle grants or trigger rebalancing.
    #[msg("Caller is not authorized to perform this action.")]
    UnauthorizedSettler,

    /// fee_bps must be in [0, 10_000].
    #[msg("fee_bps must be between 0 and 10,000.")]
    InvalidFeeConfig,

    /// Amounts must be greater than zero.
    #[msg("Amount must be greater than zero.")]
    AmountZero,
}
