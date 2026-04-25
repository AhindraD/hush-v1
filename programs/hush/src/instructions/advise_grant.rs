use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(amount: u64, charity_wallet: Pubkey, memo_hash: [u8; 32])]
pub struct AdviseGrant<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VAULT],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,

    #[account(
        mut,
        seeds = [SEED_SHIELDED, shielded_account.donor_stealth.as_ref()],
        bump = shielded_account.bump,
    )]
    pub shielded_account: Account<'info, ShieldedAccount>,

    #[account(
        init,
        payer = donor,
        space = 8 + GrantRequest::INIT_SPACE,
        seeds = [SEED_GRANT, donor.key().as_ref(), &vault.grant_nonce.to_le_bytes()],
        bump,
    )]
    pub grant_request: Account<'info, GrantRequest>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct GrantAdvised {
    pub grant_id: u64,
    pub charity_wallet: Pubkey,
    pub amount: u64,
    pub memo_hash: [u8; 32],
}

pub fn handle(
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

    shielded.shielded_balance = shielded
        .shielded_balance
        .checked_sub(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    let vault = &mut ctx.accounts.vault;
    let grant_id = vault.grant_nonce;
    vault.grant_nonce = vault
        .grant_nonce
        .checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;

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

    Ok(())
}
