/**
 * magicblock.ts — Real MagicBlock Private Payments API client for HUSH.
 *
 * Wraps the MagicBlock Private Payments REST API (https://payments.magicblock.app)
 * to provide typed, awaitable helpers for:
 *  - Depositing SPL tokens from Solana base layer → ephemeral rollup
 *  - Executing private SPL transfers inside the ephemeral rollup
 *  - Withdrawing SPL tokens back to Solana base layer
 *  - Querying private (ephemeral) balances
 *
 * API docs: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/introduction
 *
 * Flow:
 *   1. Call buildDeposit() → unsigned tx → wallet signs → submit to base RPC
 *   2. Call buildPrivateTransfer() → unsigned tx → wallet signs → submit to ephemeral RPC
 *   3. Call buildWithdraw() → unsigned tx → wallet signs → submit to ephemeral RPC
 */

import { Transaction, Connection, PublicKey } from '@solana/web3.js';
import { MAGICBLOCK_PAYMENTS_API, MAGICBLOCK_RPC, MAGICBLOCK_VALIDATORS, SOLANA_DEVNET_RPC } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export type MBCluster = 'mainnet' | 'devnet';
export type MBVisibility = 'public' | 'private';
export type MBBalance = 'base' | 'ephemeral';

/** Unsigned transaction envelope returned by all MagicBlock build endpoints */
export interface MBTxEnvelope {
  kind:                 'deposit' | 'withdraw' | 'transfer';
  version:              'legacy';
  transactionBase64:    string;
  /** Which RPC the signed tx should be submitted to */
  sendTo:               'base' | 'ephemeral';
  recentBlockhash:      string;
  lastValidBlockHeight: number;
  instructionCount:     number;
  requiredSigners:      string[];
  validator?:           string;
}

/** Response from GET /v1/spl/private-balance */
export interface MBPrivateBalance {
  address:  string;
  mint:     string;
  ata:      string;
  location: 'base' | 'ephemeral';
  /** Raw token balance as a decimal string (e.g. "1000000" = 1 USDC) */
  balance:  string;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function mbPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${MAGICBLOCK_PAYMENTS_API}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MagicBlock API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function mbGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${MAGICBLOCK_PAYMENTS_API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MagicBlock API GET ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Transaction deserialiser ──────────────────────────────────────────────────

/**
 * Deserialise a base-64 encoded legacy transaction from the MagicBlock API.
 * The caller must sign and submit it to the RPC indicated by `envelope.sendTo`.
 */
export function deserializeMBTransaction(envelope: MBTxEnvelope): Transaction {
  const buf = Buffer.from(envelope.transactionBase64, 'base64');
  return Transaction.from(buf);
}

// ── PrivatePaymentsClient ─────────────────────────────────────────────────────

export interface PrivatePaymentsClientOptions {
  cluster?:   MBCluster;
  /** Optional: override the validator identity. Defaults to API-resolved identity. */
  validator?: string;
  /** Mint address. Defaults to USDC on the selected cluster. */
  mint?:      string;
}

/**
 * PrivatePaymentsClient — thin typed wrapper around the MagicBlock
 * Private Payments REST API. All methods return unsigned tx envelopes;
 * the caller is responsible for signing and submitting.
 *
 * Usage:
 *   const client = new PrivatePaymentsClient({ cluster: 'devnet' });
 *
 *   // 1. Deposit into ephemeral rollup
 *   const depositEnv = await client.buildDeposit(ownerAddress, 1_000_000n);
 *   const tx = deserializeMBTransaction(depositEnv);
 *   // ... wallet.signTransaction(tx) → connection.sendRawTransaction(tx.serialize())
 *
 *   // 2. Private transfer inside rollup
 *   const transferEnv = await client.buildPrivateTransfer(from, to, 1_000_000n);
 *   // submit to ephemeral RPC
 *
 *   // 3. Withdraw back to base
 *   const withdrawEnv = await client.buildWithdraw(ownerAddress, 1_000_000n);
 *   // submit to ephemeral RPC
 */
export class PrivatePaymentsClient {
  readonly cluster:   MBCluster;
  readonly mint:      string;
  readonly validator: string | undefined;

  /** Appropriate Solana base RPC for this cluster */
  readonly baseRpcUrl: string;
  /** Appropriate MagicBlock ephemeral RPC for this cluster */
  readonly ephemeralRpcUrl: string;

  constructor(opts: PrivatePaymentsClientOptions = {}) {
    this.cluster   = opts.cluster   ?? 'devnet';
    this.validator = opts.validator;
    // Defaults: USDC on each cluster
    this.mint = opts.mint ?? (
      this.cluster === 'mainnet'
        ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        : '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
    );
    this.baseRpcUrl     = this.cluster === 'mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : SOLANA_DEVNET_RPC;
    this.ephemeralRpcUrl = this.cluster === 'mainnet'
      ? MAGICBLOCK_RPC.mainnet
      : MAGICBLOCK_RPC.devnet;
  }

  /**
   * Build an unsigned deposit transaction.
   * Moves `amount` of `mint` from the owner's base-layer ATA into the
   * ephemeral rollup. Submit the signed tx to `envelope.sendTo === 'base'` RPC.
   *
   * @param owner  - Base-58 owner address
   * @param amount - Token amount in base units (e.g. 1_000_000 = 1 USDC)
   */
  async buildDeposit(owner: string, amount: bigint): Promise<MBTxEnvelope> {
    return mbPost<MBTxEnvelope>('/v1/spl/deposit', {
      owner,
      amount:             Number(amount),
      cluster:            this.cluster,
      mint:               this.mint,
      ...(this.validator ? { validator: this.validator } : {}),
      initIfMissing:      true,
      initVaultIfMissing: true,
      initAtasIfMissing:  true,
    });
  }

  /**
   * Build an unsigned private transfer transaction.
   * Transfers `amount` privately inside the ephemeral rollup from `from` to `to`
   * with no on-chain correlation. Submit the signed tx to the ephemeral RPC.
   *
   * @param from    - Source address (base-58)
   * @param to      - Destination address (base-58)
   * @param amount  - Token amount in base units
   * @param memo    - Optional memo string (e.g. grant reference)
   */
  async buildPrivateTransfer(
    from:   string,
    to:     string,
    amount: bigint,
    memo?:  string,
  ): Promise<MBTxEnvelope> {
    return mbPost<MBTxEnvelope>('/v1/spl/transfer', {
      from,
      to,
      mint:               this.mint,
      amount:             Number(amount),
      visibility:         'private',
      fromBalance:        'ephemeral',
      toBalance:          'ephemeral',
      cluster:            this.cluster,
      ...(this.validator ? { validator: this.validator } : {}),
      ...(memo           ? { memo }                       : {}),
      initAtasIfMissing:  true,
    });
  }

  /**
   * Build an unsigned public transfer transaction (visible on-chain).
   * Used for settlement relay: final payout from ephemeral rollup to NPO wallet.
   *
   * @param from    - Source address (base-58), must have ephemeral balance
   * @param to      - Destination NPO / charity address (base-58)
   * @param amount  - Token amount in base units
   * @param memo    - Grant reference / NPO memo
   */
  async buildSettlementTransfer(
    from:   string,
    to:     string,
    amount: bigint,
    memo?:  string,
  ): Promise<MBTxEnvelope> {
    return mbPost<MBTxEnvelope>('/v1/spl/transfer', {
      from,
      to,
      mint:              this.mint,
      amount:            Number(amount),
      visibility:        'public',
      fromBalance:       'ephemeral',
      toBalance:         'base',
      cluster:           this.cluster,
      ...(this.validator ? { validator: this.validator } : {}),
      ...(memo           ? { memo }                      : {}),
      initAtasIfMissing: true,
    });
  }

  /**
   * Build an unsigned withdrawal transaction.
   * Moves funds from the ephemeral rollup back to the owner's base-layer ATA.
   * Submit the signed tx to the ephemeral RPC.
   *
   * @param owner  - Base-58 owner address
   * @param amount - Token amount in base units
   */
  async buildWithdraw(owner: string, amount: bigint): Promise<MBTxEnvelope> {
    return mbPost<MBTxEnvelope>('/v1/spl/withdraw', {
      owner,
      amount:            Number(amount),
      cluster:           this.cluster,
      mint:              this.mint,
      ...(this.validator ? { validator: this.validator } : {}),
      initAtasIfMissing: true,
    });
  }

  /**
   * Query the private (ephemeral rollup) token balance for an address.
   *
   * @param address - Base-58 address to query
   */
  async getPrivateBalance(address: string): Promise<MBPrivateBalance> {
    return mbGet<MBPrivateBalance>('/v1/spl/private-balance', {
      address,
      cluster: this.cluster,
      mint:    this.mint,
    });
  }

  /**
   * Query the public (base-layer) token balance for an address.
   * Convenience wrapper — same endpoint, location = 'base'.
   */
  async getPublicBalance(address: string): Promise<MBPrivateBalance> {
    return mbGet<MBPrivateBalance>('/v1/spl/balance', {
      address,
      cluster: this.cluster,
      mint:    this.mint,
    });
  }

  /**
   * Sign an MBTxEnvelope with a browser wallet and submit to the correct RPC.
   * `signTransaction` should be `wallet.signTransaction` from the Wallet Standard.
   *
   * @param envelope         - Unsigned tx from any build* method
   * @param signTransaction  - Browser wallet signing function
   */
  async signAndSubmit(
    envelope:        MBTxEnvelope,
    signTransaction: (tx: import('@solana/web3.js').Transaction) => Promise<import('@solana/web3.js').Transaction>,
  ): Promise<string> {
    const tx      = deserializeMBTransaction(envelope);
    const signed  = await signTransaction(tx);
    const rpcUrl  = envelope.sendTo === 'base' ? this.baseRpcUrl : this.ephemeralRpcUrl;
    const conn    = new Connection(rpcUrl, 'confirmed');
    return conn.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a PrivatePaymentsClient for the given cluster.
 * This is the primary entry point for HUSH server-side and frontend integration.
 */
export function createPrivatePaymentsClient(
  opts?: PrivatePaymentsClientOptions,
): PrivatePaymentsClient {
  return new PrivatePaymentsClient(opts);
}
