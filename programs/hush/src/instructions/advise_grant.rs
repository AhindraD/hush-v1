use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(charity_wallet: Pubkey, amount: u64)]
pub struct AdviseGrant<'info> {
    #[account(
        mut,
        has_one = owner @ ErrorCode::Unauthorized,
        constraint = daf_account.is_active @ ErrorCode::InactiveDafAccount
    )]
    pub daf_account: Account<'info, DafAccount>,
    #[account(
        init,
        payer = owner,
        space = 8 + GrantRequest::INIT_SPACE,
        seeds = [b"grant_request", daf_account.key().as_ref(), charity_wallet.as_ref(), &daf_account.grant_count.to_le_bytes()],
        bump
    )]
    pub grant_request: Account<'info, GrantRequest>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AdviseGrant>,
    charity_wallet: Pubkey,
    amount: u64,
    tax_year: u16,
) -> Result<()> {
    let daf_account = &mut ctx.accounts.daf_account;

    // Check balance
    require!(
        daf_account.balance_usdc >= amount,
        ErrorCode::InsufficientBalance
    );

    // Deduct balance
    daf_account.balance_usdc = daf_account
        .balance_usdc
        .checked_sub(amount)
        .ok_or(ErrorCode::MathUnderflow)?;
    daf_account.grant_count = daf_account
        .grant_count
        .checked_add(1)
        .ok_or(ErrorCode::MathOverflow)?;

    // Initialize grant request
    let grant_request = &mut ctx.accounts.grant_request;
    grant_request.daf_account = daf_account.key();
    grant_request.charity_wallet = charity_wallet;
    grant_request.amount_usdc = amount;
    grant_request.tax_year = tax_year;
    grant_request.status = GrantStatus::Pending;
    grant_request.bump = ctx.bumps.grant_request;

    Ok(())
}

use crate::errors::ErrorCode;
