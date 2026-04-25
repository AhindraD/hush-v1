use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use crate::states::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(grant_id: u64)]
pub struct SettleGrant<'info> {
    #[account(mut)]
    pub settler: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VAULT],
        bump = vault.bump,
    )]
    pub vault: Account<'info, HushVault>,

    #[account(
        mut,
        seeds = [SEED_GRANT, grant_request.donor.as_ref(), &grant_id.to_le_bytes()],
        bump = grant_request.bump,
    )]
    pub grant_request: Account<'info, GrantRequest>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = settler,
        associated_token::mint = usdc_mint,
        associated_token::authority = grant_request.charity_wallet,
    )]
    pub charity_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct GrantSettled {
    pub grant_id: u64,
    pub charity_wallet: Pubkey,
    pub amount: u64,
    pub tx_signature: [u8; 64],
}

pub fn handle(ctx: Context<SettleGrant>, grant_id: u64) -> Result<()> {
    let caller = ctx.accounts.settler.key();
    let vault_authority = ctx.accounts.vault.authority;
    require!(
        caller == vault_authority,
        HushError::UnauthorizedSettler
    );

    let grant = &mut ctx.accounts.grant_request;
    require!(!grant.settled, HushError::GrantAlreadySettled);
    require!(grant.grant_id == grant_id, HushError::GrantAlreadySettled);

    let amount = grant.amount;
    let vault_bump = ctx.accounts.vault.bump;
    let seeds: &[&[u8]] = &[SEED_VAULT, &[vault_bump]];
    let signer_seeds = &[seeds];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.charity_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    transfer(cpi_ctx, amount)?;

    grant.settled = true;

    let vault = &mut ctx.accounts.vault;
    vault.total_granted = vault
        .total_granted
        .checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    vault.total_shielded = vault
        .total_shielded
        .checked_sub(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    emit!(GrantSettled {
        grant_id,
        charity_wallet: grant.charity_wallet,
        amount,
        tx_signature: [0u8; 64],
    });

    Ok(())
}
