use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

use instructions::*;

declare_id!("9654iuLbWfpABAr2cyQBDVbAeKWeQyzwrfmv3aEi5XnP");

#[program]
pub mod hush {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        yield_agent: Pubkey,
        settlement_escrow: Pubkey,
    ) -> Result<()> {
        instructions::initialize_vault::handler(ctx, yield_agent, settlement_escrow)
    }

    pub fn create_daf_account(
        ctx: Context<CreateDafAccount>,
        stealth_meta_address: [u8; 32],
        viewing_key_hash: [u8; 32],
    ) -> Result<()> {
        instructions::create_daf_account::handler(ctx, stealth_meta_address, viewing_key_hash)
    }

    pub fn shield_deposit(
        ctx: Context<ShieldDeposit>,
        amount: u64,
        stealth_pubkey: [u8; 32],
    ) -> Result<()> {
        instructions::shield_deposit::handler(ctx, amount, stealth_pubkey)
    }

    pub fn advise_grant(
        ctx: Context<AdviseGrant>,
        charity_wallet: Pubkey,
        amount: u64,
        tax_year: u16,
    ) -> Result<()> {
        instructions::advise_grant::handler(ctx, charity_wallet, amount, tax_year)
    }

    pub fn settle_grant(
        ctx: Context<SettleGrant>,
        settlement_tx_hash: [u8; 32],
    ) -> Result<()> {
        instructions::settle_grant::handler(ctx, settlement_tx_hash)
    }

    pub fn rebalance_yield(
        ctx: Context<RebalanceYield>,
        yield_amount: u64,
    ) -> Result<()> {
        instructions::rebalance_yield::handler(ctx, yield_amount)
    }
}
