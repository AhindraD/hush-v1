use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DafAccount {
    pub owner: Pubkey,
    pub stealth_meta_address: [u8; 32],
    pub balance_usdc: u64,
    pub total_deposited: u64,
    pub total_granted: u64,
    pub total_yield_accrued: u64,
    pub viewing_key_hash: [u8; 32],
    pub is_active: bool,
    pub bump: u8,
}
