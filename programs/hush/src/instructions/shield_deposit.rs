use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use crate::states::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(amount: u64, stealth_pubkey: [u8; 32])]
pub struct ShieldDepositCtx<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VAULT],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,

    #[account(
        init_if_needed,
        payer = donor,
        space = 8 + ShieldedAccount::INIT_SPACE,
        seeds = [SEED_SHIELDED, stealth_pubkey.as_ref()],
        bump,
    )]
    pub shielded_account: Box<Account<'info, ShieldedAccount>>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = donor,
    )]
    pub donor_token_account: Account<'info, TokenAccount>,

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

#[event]
pub struct ShieldedDeposit {
    pub stealth_pubkey: [u8; 32],
    pub amount: u64,
    pub encrypted_random: [u8; 32],
    pub timestamp: i64,
}

pub fn handle(
    ctx: Context<ShieldDepositCtx>,
    amount: u64,
    stealth_pubkey: [u8; 32],
    encrypted_random: [u8; 32],
) -> Result<()> {
    require!(amount > 0, HushError::AmountZero);

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.key(),
        Transfer {
            from: ctx.accounts.donor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.donor.to_account_info(),
        },
    );
    transfer(cpi_ctx, amount)?;

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

    let vault = &mut ctx.accounts.vault;
    vault.total_shielded = vault
        .total_shielded
        .checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    emit!(ShieldedDeposit {
        stealth_pubkey,
        amount,
        encrypted_random,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
