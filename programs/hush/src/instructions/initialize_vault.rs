use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializeVaultCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + HushVault::INIT_SPACE,
        seeds = [SEED_VAULT],
        bump,
    )]
    pub vault: Account<'info, HushVault>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitializeVaultCtx>, fee_bps: u16) -> Result<()> {
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
