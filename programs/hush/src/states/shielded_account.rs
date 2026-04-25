use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct ShieldedAccount {
    /// 32-byte stealth public key that controls this balance.
    pub donor_stealth: [u8; 32],
    /// Current reserved balance in USDC micro-units.
    pub shielded_balance: u64,
    /// Number of deposits into this account.
    pub deposit_count: u64,
    /// PDA bump.
    pub bump: u8,
}
