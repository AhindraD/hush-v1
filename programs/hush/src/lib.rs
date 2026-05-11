//! HUSH — Confidential Philanthropy Engine on Solana
//!
//! Provides stealth deposits (Umbra-style ECDH), private yield (MagicBlock PER),
//! and selective disclosure (viewing keys) for on-chain Donor Advised Funds (DAFs).

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;

use instructions::*;

declare_id!("GYk5n2QcGLQqTwafyURtbsaorWXaeYLjZGrE9r5skR3m");

#[program]
pub mod hush {
    use super::*;

    /// Initialize the global HUSH vault PDA.
    pub fn initialize_vault(ctx: Context<InitializeVaultCtx>, fee_bps: u16) -> Result<()> {
        instructions::initialize_vault::handle(ctx, fee_bps)
    }

    /// Shield a USDC deposit into the global vault via a stealth pubkey.
    pub fn shield_deposit(
        ctx: Context<ShieldDepositCtx>,
        amount: u64,
        stealth_pubkey: [u8; 32],
        encrypted_random: [u8; 32],
    ) -> Result<()> {
        instructions::shield_deposit::handle(ctx, amount, stealth_pubkey, encrypted_random)
    }

    /// Advise a grant from a shielded balance to a charity wallet.
    pub fn advise_grant(
        ctx: Context<AdviseGrantCtx>,
        amount: u64,
        charity_wallet: Pubkey,
        memo_hash: [u8; 32],
    ) -> Result<()> {
        instructions::advise_grant::handle(ctx, amount, charity_wallet, memo_hash)
    }

    /// Settle a pending `GrantRequest` by transferring USDC from the vault to
    /// the charity wallet.
    pub fn settle_grant(ctx: Context<SettleGrantCtx>, grant_id: u64) -> Result<()> {
        instructions::settle_grant::handle(ctx, grant_id)
    }

    /// AI agent memo instruction to record a yield rebalancing event.
    pub fn rebalance_yield(ctx: Context<RebalanceYieldCtx>, protocol: u8, amount: u64) -> Result<()> {
        instructions::rebalance_yield::handle(ctx, protocol, amount)
    }
}
