use anchor_lang::prelude::*;
use crate::states::*;

#[derive(Accounts)]
pub struct CreateDafAccount<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + DafAccount::INIT_SPACE,
        seeds = [b"daf_account", owner.key().as_ref()],
        bump
    )]
    pub daf_account: Account<'info, DafAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateDafAccount>, stealth_meta_address: [u8; 32], viewing_key_hash: [u8; 32]) -> Result<()> {
    let daf_account = &mut ctx.accounts.daf_account;
    daf_account.owner = ctx.accounts.owner.key();
    daf_account.stealth_meta_address = stealth_meta_address;
    daf_account.balance_usdc = 0;
    daf_account.total_deposited = 0;
    daf_account.total_granted = 0;
    daf_account.total_yield_accrued = 0;
    daf_account.viewing_key_hash = viewing_key_hash;
    daf_account.is_active = true;
    daf_account.bump = ctx.bumps.daf_account;
    Ok(())
}
