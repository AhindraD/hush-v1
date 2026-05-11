import type { GrantStatus, YieldProtocol } from './program';

// ---------------------------------------------------------------------------
// UI / Domain models
// ---------------------------------------------------------------------------

/**
 * UI model representing a donor's complete shielded state.
 *
 * Aggregates on-chain `ShieldedAccountData` with derived display values.
 * Never exposed to third parties — only constructed client-side using
 * the donor's viewing key.
 */
export interface ShieldedBalance {
  /** Base-58 encoded stealth public key for this account. */
  stealthAddress: string;
  /** USDC balance available (human-readable, e.g. `123.456789`). */
  availableUsdc: number;
  /** Total USDC deposited into this shielded account over all time. */
  totalDeposited: number;
  /** Total USDC granted out from this shielded account over all time. */
  totalGranted: number;
  /** Cumulative yield earned (USDC). */
  yieldEarned: number;
  /** Currently assigned yield protocol. */
  yieldProtocol: YieldProtocol;
  /** Current APY for the assigned protocol (percentage, e.g. `8.21`). */
  currentApy: number;
  /** ISO-8601 timestamp when the shielded account was created. */
  createdAt: string;
}

/**
 * UI model for a grant advisory.
 *
 * Combines on-chain `GrantRequestData` with human-readable fields
 * for display in dashboards and tax receipt generation.
 */
export interface GrantAdvisory {
  /** Unique composite ID: `<stealthAddress>:<grantId>`. */
  id: string;
  /** Monotonically increasing on-chain grant ID. */
  grantId: number;
  /** Base-58 encoded donor stealth address. */
  stealthAddress: string;
  /** USDC amount requested (human-readable). */
  amount: number;
  /** Base-58 encoded charity wallet public key. */
  charityWallet: string;
  /** Optional human-readable memo decoded off-chain. */
  memo: string | null;
  /** SHA-256 hex string of the memo, as stored on-chain. */
  memoHash: string;
  /** Current lifecycle status of the grant. */
  status: GrantStatus;
  /** ISO-8601 timestamp when the grant was advised. */
  advisedAt: string;
  /** ISO-8601 timestamp when the grant was settled, or null if pending. */
  settledAt: string | null;
}

/**
 * Represents a donor's allocation within a single yield protocol.
 */
export interface YieldPosition {
  /** The yield protocol this position belongs to. */
  protocol: YieldProtocol;
  /** Human-readable label for the protocol (e.g. `"Kamino Finance"`). */
  protocolLabel: string;
  /** USDC allocated to this protocol (human-readable). */
  allocatedUsdc: number;
  /** Current APY for this protocol (percentage, e.g. `8.21`). */
  currentApy: number;
  /** Yield accrued in this position since last rebalance (USDC). */
  accruedYield: number;
}

/**
 * Result of decrypting an event log entry with a donor's viewing key.
 *
 * Used by auditors or donors to reconstruct the full history of a
 * shielded account without knowing the spending key.
 */
export interface AuditRecord {
  /** Unique record ID (transaction signature + log index). */
  id: string;
  /** Solana transaction signature containing the event. */
  txSignature: string;
  /** Slot in which the transaction was confirmed. */
  slot: number;
  /** ISO-8601 block timestamp. */
  timestamp: string;
  /** Event type discriminant. */
  eventType: 'deposit' | 'grant_advised' | 'grant_settled' | 'rebalance';
  /** Decrypted USDC amount involved in this event. */
  amount: number;
  /**
   * Counterpart wallet, if relevant.
   * - For `grant_advised` / `grant_settled`: the charity wallet.
   * - For `deposit`: null (self-deposit).
   * - For `rebalance`: null.
   */
  counterpart: string | null;
  /** Optional decoded memo text (null if the event has no memo). */
  memo: string | null;
}

/**
 * Donor-generated tax receipt for a single calendar year.
 *
 * Computed client-side from `AuditRecord[]` after decryption with
 * the donor's viewing key. Never stored on-chain.
 */
export interface TaxReceipt {
  /** Opaque receipt identifier (UUID v4 or deterministic hash). */
  zkReceiptId: string;
  /** Calendar year this receipt covers (e.g. `2024`). */
  taxYear: number;
  /** Ordered list of deposit events for the year. */
  deposits: Array<{
    /** ISO-8601 date of the deposit. */
    date: string;
    /** Solana transaction signature. */
    txSignature: string;
    /** USDC amount deposited. */
    amount: number;
  }>;
  /** Ordered list of settled grants for the year. */
  grants: Array<{
    /** ISO-8601 date the grant was settled. */
    date: string;
    /** Solana transaction signature. */
    txSignature: string;
    /** USDC amount granted. */
    amount: number;
    /** Charity wallet that received the funds. */
    charityWallet: string;
    /** Optional decoded memo. */
    memo: string | null;
  }>;
  /** Sum of all deposits in `deposits` (USDC). */
  totalDeposited: number;
  /** Sum of all settled grant amounts in `grants` (USDC). */
  totalGranted: number;
  /** Total yield earned during the year (USDC). */
  yieldEarned: number;
  /** ISO-8601 timestamp when this receipt was generated. */
  generatedAt: string;
}
