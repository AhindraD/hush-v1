use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TokenAccount, TokenInterface, TransferChecked};
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct ShieldDeposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub daf_account: Account<'info, DafAccount>,
    #[account(mut)]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub depositor_token_account: InterfaceAccount<'info, TokenAccount>,
    pub usdc_mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,
    pub depositor: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<ShieldDeposit>, amount: u64, stealth_pubkey: [u8; 32]) -> Result<()> {
    // Transfer USDC to vault using transfer_checked for better safety
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.depositor_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
        mint: ctx.accounts.usdc_mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
    token_interface::transfer_checked(cpi_ctx, amount, ctx.accounts.usdc_mint.decimals)?;

    // Update DAF account using checked math
    let daf_account = &mut ctx.accounts.daf_account;
    daf_account.balance_usdc = daf_account.balance_usdc.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
    daf_account.total_deposited = daf_account.total_deposited.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;

    // Emit event for MagicBlock PER
    emit!(ShieldedDepositEvent {
        daf_account: daf_account.key(),
        amount,
        stealth_pubkey,
    });

    Ok(())
}

#[event]
pub struct ShieldedDepositEvent {
    pub daf_account: Pubkey,
    pub amount: u64,
    pub stealth_pubkey: [u8; 32],
}
