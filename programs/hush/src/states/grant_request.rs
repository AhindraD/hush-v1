use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct GrantRequest {
    /// The donor who created this grant.
    pub donor: Pubkey,
    /// On-chain wallet of the beneficiary charity.
    pub charity_wallet: Pubkey,
    /// USDC amount in micro-units.
    pub amount: u64,
    /// 32-byte hash of optional off-chain memo / purpose.
    pub memo_hash: [u8; 32],
    /// Whether the grant has been disbursed to the charity.
    pub settled: bool,
    /// Sequential grant ID (matches the vault nonce snapshot at creation).
    pub grant_id: u64,
    /// PDA bump.
    pub bump: u8,
}
