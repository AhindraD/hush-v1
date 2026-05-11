import type { PublicKey } from '@solana/web3.js';
import type BN from 'bn.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Yield protocol identifiers, matching the on-chain Rust enum discriminants.
 *
 * ```rust
 * pub enum YieldProtocol { Kamino = 0, Jito = 1, Marginfi = 2, Drift = 3 }
 * ```
 */
export enum YieldProtocol {
  Kamino = 0,
  Jito = 1,
  Marginfi = 2,
  Drift = 3,
}

/**
 * Lifecycle state of a grant advisory on-chain.
 *
 * ```rust
 * pub enum GrantStatus { Pending = 0, Approved = 1, Settled = 2, Cancelled = 3 }
 * ```
 */
export enum GrantStatus {
  /** Grant has been advised but not yet approved by the administrator. */
  Pending = 0,
  /** Grant has been approved and is queued for settlement. */
  Approved = 1,
  /** Grant has been fully disbursed to the charity wallet. */
  Settled = 2,
  /** Grant was cancelled before settlement. */
  Cancelled = 3,
}

// ---------------------------------------------------------------------------
// On-chain account mirrors
// ---------------------------------------------------------------------------

/**
 * Mirrors the `HushVault` Anchor account struct.
 *
 * Holds global program state: total deposited USDC, total granted,
 * accrued yield, and per-protocol allocations.
 */
export interface HushVaultAccount {
  /** Program admin authority (can approve/settle grants). */
  authority: PublicKey;
  /** USDC mint used for all deposits and grants. */
  usdcMint: PublicKey;
  /** PDA bump for the vault account. */
  bump: number;
  /** Total USDC deposited across all shielded accounts (lamports-style, 6 decimals). */
  totalDeposited: BN;
  /** Total USDC that has been granted out (settled). */
  totalGranted: BN;
  /** Accumulated yield collected by the protocol (before distribution). */
  accruedYield: BN;
  /** Per-protocol USDC allocations, indexed by `YieldProtocol` discriminant. */
  protocolAllocations: BN[];
}

/**
 * Mirrors the `ShieldedAccount` Anchor account struct.
 *
 * One account per stealth address; tracks the donor's private balance
 * and the encrypted random used to reconstruct the stealth key.
 */
export interface ShieldedAccountData {
  /** The stealth public key (Ed25519) associated with this account. */
  stealthPubkey: Uint8Array; // [u8; 32]
  /** Encrypted random scalar used to re-derive the stealth key via ECDH. */
  encryptedRandom: Uint8Array; // [u8; 64]
  /** USDC balance held in this shielded account (6 decimals). */
  balance: BN;
  /** Yield protocol currently assigned to this account's balance. */
  yieldProtocol: YieldProtocol;
  /** Accumulated yield earned by this account. */
  yieldAccrued: BN;
  /** Unix timestamp (seconds) when this account was first created. */
  createdAt: BN;
  /** PDA bump for this shielded account. */
  bump: number;
}

/**
 * Mirrors the `GrantRequest` Anchor account struct.
 *
 * Records a single donor-initiated grant advisory from their shielded balance.
 */
export interface GrantRequestData {
  /** The donor's stealth public key that owns this grant. */
  stealthPubkey: Uint8Array; // [u8; 32]
  /** Monotonically increasing grant ID per stealth key. */
  grantId: BN;
  /** Amount of USDC requested to grant (6 decimals). */
  amount: BN;
  /** Destination charity wallet address. */
  charityWallet: PublicKey;
  /** SHA-256 hash of an off-chain memo (purpose, notes). */
  memoHash: Uint8Array; // [u8; 32]
  /** Current lifecycle status of this grant. */
  status: GrantStatus;
  /** Unix timestamp when the grant was advised. */
  advisedAt: BN;
  /** Unix timestamp when the grant was settled (0 if not yet settled). */
  settledAt: BN;
  /** PDA bump for this grant account. */
  bump: number;
}

// ---------------------------------------------------------------------------
// Program events
// ---------------------------------------------------------------------------

/**
 * Emitted by the `shield_deposit` instruction when a deposit is recorded.
 */
export interface DepositEvent {
  /** The stealth public key that received the deposit. */
  stealthPubkey: Uint8Array; // [u8; 32]
  /** Amount deposited in USDC (6 decimals). */
  amount: BN;
  /** Unix timestamp of the deposit. */
  timestamp: BN;
}

/**
 * Emitted by the `advise_grant` instruction when a new grant advisory is created.
 */
export interface GrantAdvisedEvent {
  /** The stealth public key of the donor. */
  stealthPubkey: Uint8Array; // [u8; 32]
  /** Monotonically increasing grant ID. */
  grantId: BN;
  /** Requested grant amount in USDC (6 decimals). */
  amount: BN;
  /** Destination charity wallet. */
  charityWallet: PublicKey;
  /** SHA-256 memo hash. */
  memoHash: Uint8Array; // [u8; 32]
  /** Unix timestamp when advised. */
  timestamp: BN;
}

/**
 * Emitted by the `settle_grant` instruction when a grant is disbursed.
 */
export interface GrantSettledEvent {
  /** Grant ID that was settled. */
  grantId: BN;
  /** The stealth public key of the originating donor. */
  stealthPubkey: Uint8Array; // [u8; 32]
  /** Charity wallet that received the funds. */
  charityWallet: PublicKey;
  /** Actual amount disbursed (may differ from requested if partially settled). */
  amount: BN;
  /** Unix timestamp of settlement. */
  timestamp: BN;
}

/**
 * Emitted by the `rebalance_yield` instruction when yield positions are rebalanced.
 */
export interface RebalanceYieldEvent {
  /** Source yield protocol that funds moved from. */
  fromProtocol: YieldProtocol;
  /** Destination yield protocol that funds moved to. */
  toProtocol: YieldProtocol;
  /** Amount of USDC rebalanced (6 decimals). */
  amount: BN;
  /** New APY snapshot for the destination protocol (basis points, e.g. 821 = 8.21%). */
  newApyBps: number;
  /** Unix timestamp of the rebalance. */
  timestamp: BN;
}
