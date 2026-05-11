use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Math underflow")]
    MathUnderflow,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid status transition")]
    InvalidStatusTransition,
    #[msg("Invalid token mint")]
    InvalidMint,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("DAF account is inactive")]
    InactiveDafAccount,
}
