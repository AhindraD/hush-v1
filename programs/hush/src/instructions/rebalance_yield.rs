use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct RebalanceYield<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub daf_account: Account<'info, DafAccount>,
    pub yield_agent: Signer<'info>,
}

pub fn handler(ctx: Context<RebalanceYield>, yield_amount: u64) -> Result<()> {
    require_keys_eq!(ctx.accounts.yield_agent.key(), ctx.accounts.vault.yield_agent, ErrorCode::Unauthorized);

    let daf_account = &mut ctx.accounts.daf_account;
    
    // Add yield to balance and total accrued using checked math
    daf_account.balance_usdc = daf_account.balance_usdc.checked_add(yield_amount).ok_or(ErrorCode::MathOverflow)?;
    daf_account.total_yield_accrued = daf_account.total_yield_accrued.checked_add(yield_amount).ok_or(ErrorCode::MathOverflow)?;

    Ok(())
}
