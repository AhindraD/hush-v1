import type { YieldProtocol } from './program';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/**
 * Standard error envelope returned by all HUSH API endpoints on failure.
 */
export interface ApiError {
  /** Machine-readable error code (e.g. `"INSUFFICIENT_BALANCE"`). */
  code: string;
  /** Human-readable error message. */
  message: string;
  /** Optional additional context (validation errors, nested details, etc.). */
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Deposit
// ---------------------------------------------------------------------------

/**
 * Request body for `POST /api/deposit`.
 *
 * Initiates a shielded USDC deposit. The caller must have already
 * generated a stealth address off-chain.
 */
export interface DepositRequest {
  /** Base-58 encoded stealth public key (Ed25519) for the recipient. */
  stealthPubkey: string;
  /**
   * Base-64 encoded encrypted random scalar used for stealth key recovery.
   * Produced by `generateStealthAddress()` in `@hush/sdk`.
   */
  encryptedRandom: string;
  /**
   * Base-64 encoded ephemeral public key used in the ECDH handshake.
   * Must be stored alongside `encryptedRandom` for later recovery.
   */
  ephemeralPubkey: string;
  /** USDC amount to deposit, in raw lamport-style units (6 decimals). */
  amountRaw: string; // string to avoid JS bigint serialization issues
  /** Base-58 encoded USDC mint. Defaults to the devnet USDC mint if omitted. */
  usdcMint?: string;
  /**
   * Signed and serialized transaction (base-64) that moves USDC from
   * the donor's wallet into the vault. Signed by the donor's wallet
   * before submitting to this endpoint.
   */
  signedTx: string;
}

/**
 * Response from `POST /api/deposit`.
 */
export interface DepositResponse {
  /** Solana transaction signature for the confirmed deposit transaction. */
  txSignature: string;
  /** Slot at which the transaction was confirmed. */
  slot: number;
  /** Base-58 encoded stealth address that received the deposit. */
  stealthAddress: string;
  /** USDC balance of the shielded account after the deposit (6 decimals, raw). */
  newBalanceRaw: string;
}

// ---------------------------------------------------------------------------
// Grant
// ---------------------------------------------------------------------------

/**
 * Request body for `POST /api/grant`.
 *
 * Submits a grant advisory from a donor's shielded balance.
 * Authentication is provided via the signed transaction.
 */
export interface GrantRequest {
  /** Base-58 encoded donor stealth public key. */
  stealthPubkey: string;
  /** USDC amount to grant, in raw units (6 decimals). */
  amountRaw: string;
  /** Base-58 encoded destination charity wallet. */
  charityWallet: string;
  /**
   * SHA-256 hash (hex string, 64 chars) of the off-chain memo.
   * The memo itself is stored off-chain or encrypted to the charity.
   */
  memoHash: string;
  /**
   * Monotonically increasing grant ID, unique per stealth key.
   * Callers should fetch the current count from the API before advising.
   */
  grantId: string;
  /**
   * Signed and serialized transaction (base-64) that calls the
   * `advise_grant` instruction on-chain.
   */
  signedTx: string;
}

/**
 * Response from `POST /api/grant`.
 */
export interface GrantResponse {
  /** Solana transaction signature for the confirmed advisory transaction. */
  txSignature: string;
  /** Slot at which the transaction was confirmed. */
  slot: number;
  /** On-chain grant ID assigned to this advisory. */
  grantId: string;
  /** Lifecycle status immediately after creation (always `"Pending"`). */
  status: 'Pending';
  /** ISO-8601 timestamp when the advisory was recorded on-chain. */
  advisedAt: string;
}

// ---------------------------------------------------------------------------
// Rebalance
// ---------------------------------------------------------------------------

/**
 * Request body for `POST /api/rebalance`.
 *
 * Admin-only endpoint that triggers a yield rebalance across protocols.
 * Requires a signed admin transaction.
 */
export interface RebalanceRequest {
  /** Source yield protocol to move funds from. */
  fromProtocol: YieldProtocol;
  /** Destination yield protocol to move funds to. */
  toProtocol: YieldProtocol;
  /** USDC amount to rebalance, in raw units (6 decimals). */
  amountRaw: string;
  /**
   * Signed and serialized admin transaction (base-64) calling
   * `rebalance_yield` on-chain.
   */
  signedTx: string;
}

/**
 * Response from `POST /api/rebalance`.
 */
export interface RebalanceResponse {
  /** Solana transaction signature for the confirmed rebalance transaction. */
  txSignature: string;
  /** Slot at which the transaction was confirmed. */
  slot: number;
  /** Protocol that funds moved from. */
  fromProtocol: YieldProtocol;
  /** Protocol that funds moved to. */
  toProtocol: YieldProtocol;
  /** Amount actually rebalanced (raw USDC units). */
  amountRaw: string;
  /** Snapshot APY of the destination protocol after the rebalance (basis points). */
  newApyBps: number;
}

// ---------------------------------------------------------------------------
// Viewing key (audit / tax receipt)
// ---------------------------------------------------------------------------

/**
 * Request body for `POST /api/viewing-key`.
 *
 * Decrypts on-chain events using the provided viewing key and returns
 * a structured audit trail for the associated shielded account.
 */
export interface ViewingKeyRequest {
  /**
   * Base-58 encoded viewing key (prefixed with `"vk_"`).
   * Produced by `encodeViewingKey()` in `@hush/sdk`.
   */
  encodedViewingKey: string;
  /**
   * Optional calendar year filter. If provided, only events from
   * that year are returned (useful for tax receipt generation).
   */
  taxYear?: number;
  /**
   * Maximum number of audit records to return. Defaults to 100.
   * Use in conjunction with `cursor` for pagination.
   */
  limit?: number;
  /** Opaque pagination cursor returned by a previous response. */
  cursor?: string;
}

/**
 * Response from `POST /api/viewing-key`.
 */
export interface ViewingKeyResponse {
  /** Base-58 encoded stealth address recovered from the viewing key. */
  stealthAddress: string;
  /** Decrypted and structured audit records for this shielded account. */
  auditRecords: Array<{
    /** Solana transaction signature. */
    txSignature: string;
    /** Confirmed slot. */
    slot: number;
    /** ISO-8601 block timestamp. */
    timestamp: string;
    /** Event type discriminant. */
    eventType: 'deposit' | 'grant_advised' | 'grant_settled' | 'rebalance';
    /** USDC amount involved (human-readable). */
    amount: number;
    /** Counterpart wallet (charity), if applicable. */
    counterpart: string | null;
    /** Decoded memo text, if available. */
    memo: string | null;
  }>;
  /** Aggregated summary across all returned records. */
  summary: {
    /** Total USDC deposited. */
    totalDeposited: number;
    /** Total USDC granted (settled). */
    totalGranted: number;
    /** Total yield earned. */
    yieldEarned: number;
    /** Current shielded USDC balance. */
    currentBalance: number;
  };
  /** Opaque cursor for fetching the next page, or null if exhausted. */
  nextCursor: string | null;
}
