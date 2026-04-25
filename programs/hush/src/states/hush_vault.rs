use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct HushVault {
    /// Authority that can settle grants and trigger rebalancing.
    pub authority: Pubkey,
    /// Protocol fee in basis points (0–10_000).
    pub fee_bps: u16,
    /// Running total of USDC currently inside the vault.
    pub total_shielded: u64,
    /// Running total of USDC ever granted to charities.
    pub total_granted: u64,
    /// Monotonically increasing counter; used as GrantRequest PDA seed.
    pub grant_nonce: u64,
    /// PDA bump.
    pub bump: u8,
}
