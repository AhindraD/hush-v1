use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub settlement_escrow: Pubkey,
    pub yield_agent: Pubkey,
    pub total_tvl: u64,
    pub bump: u8,
}
