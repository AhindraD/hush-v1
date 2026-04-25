use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct RebalanceYield<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [SEED_VAULT],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,
}

#[event]
pub struct RebalanceYield {
    pub protocol: u8,
    pub amount: u64,
    pub timestamp: i64,
}

pub fn handle(ctx: Context<RebalanceYield>, protocol: u8, amount: u64) -> Result<()> {
    require!(amount > 0, HushError::AmountZero);
    require!(
        ctx.accounts.authority.key() == ctx.accounts.vault.authority,
        HushError::UnauthorizedSettler
    );

    emit!(RebalanceYield {
        protocol,
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
