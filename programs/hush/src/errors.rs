use anchor_lang::prelude::*;

#[error_code]
pub enum HushError {
    /// Shielded balance is too low to cover the requested grant amount.
    #[msg("Insufficient shielded balance for this grant.")]
    InsufficientShieldedBalance,

    /// The GrantRequest has already been settled; cannot settle again.
    #[msg("This grant has already been settled.")]
    GrantAlreadySettled,

    /// The caller is not authorized to settle grants or trigger rebalancing.
    #[msg("Caller is not authorized to perform this action.")]
    UnauthorizedSettler,

    /// fee_bps must be in [0, 10_000].
    #[msg("fee_bps must be between 0 and 10,000.")]
    InvalidFeeConfig,

    /// Amounts must be greater than zero.
    #[msg("Amount must be greater than zero.")]
    AmountZero,
}
