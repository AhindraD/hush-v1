use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GrantRequest {
    pub daf_account: Pubkey,
    pub charity_wallet: Pubkey,
    pub amount_usdc: u64,
    pub tax_year: u16,
    pub status: GrantStatus,
    pub settlement_tx_hash: Option<[u8; 32]>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq)]
pub enum GrantStatus {
    Pending,
    Processing,
    Settled,
    Failed,
}
