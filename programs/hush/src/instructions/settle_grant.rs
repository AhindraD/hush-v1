use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TokenAccount, TokenInterface, TransferChecked};
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct SettleGrant<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        seeds = [b"vault_token"],
        bump,
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        has_one = daf_account,
        constraint = grant_request.status == GrantStatus::Pending @ ErrorCode::InvalidStatusTransition
    )]
    pub grant_request: Account<'info, GrantRequest>,
    pub daf_account: Account<'info, DafAccount>,
    #[account(mut)]
    pub charity_token_account: InterfaceAccount<'info, TokenAccount>,
    pub usdc_mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,
    pub relayer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<SettleGrant>, settlement_tx_hash: [u8; 32]) -> Result<()> {
    let amount = ctx.accounts.grant_request.amount_usdc;

    // Transfer USDC from vault to charity
    let authority_key = ctx.accounts.vault.authority;
    let seeds = &[
        b"vault",
        authority_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.charity_token_account.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.usdc_mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.key(), cpi_accounts, signer);
    token_interface::transfer_checked(cpi_ctx, amount, ctx.accounts.usdc_mint.decimals)?;

    // Update grant request
    let grant_request = &mut ctx.accounts.grant_request;
    grant_request.status = GrantStatus::Settled;
    grant_request.settlement_tx_hash = Some(settlement_tx_hash);

    Ok(())
}
