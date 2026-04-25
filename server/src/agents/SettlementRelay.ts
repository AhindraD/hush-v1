/**
 * SettlementRelay.ts
 *
 * Server-side agent that polls for pending grant requests and settles them
 * via the MagicBlock Private Payments API.
 *
 * Settlement flow (per grant):
 *   1. Fetch pending grants from the DB
 *   2. Call MagicBlock POST /v1/spl/transfer (visibility: private) to move
 *      USDC from the relay ephemeral balance to the NPO's ephemeral ATA
 *   3. Call MagicBlock POST /v1/spl/transfer (visibility: public) to settle
 *      the NPO's ephemeral balance → their base-layer wallet
 *   4. Mark grant as settled in DB
 *
 * The relay wallet keypair is loaded from RELAY_PRIVATE_KEY env var.
 * Transactions are signed server-side (relay is the ephemeral balance holder).
 *
 * API: https://payments.magicblock.app
 *      POST /v1/spl/transfer
 *      GET  /v1/spl/private-balance
 */

import { Keypair, Connection, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { db } from '../db/client';
import { grants } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// ── Config ────────────────────────────────────────────────────────────────────

const PAYMENTS_API   = 'https://payments.magicblock.app';
const CLUSTER        = (process.env.MAGICBLOCK_CLUSTER ?? 'devnet') as 'devnet' | 'mainnet';
const POLL_INTERVAL  = 10_000; // 10 seconds
const BASE_RPC       = CLUSTER === 'mainnet'
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';
const EPHEMERAL_RPC  = CLUSTER === 'mainnet'
  ? 'https://mainnet.magicblock.app'
  : 'https://devnet.magicblock.app';

// ── Relay wallet ──────────────────────────────────────────────────────────────

function loadRelayKeypair(): Keypair | null {
  const raw = process.env.RELAY_PRIVATE_KEY;
  if (!raw) {
    console.warn('[SettlementRelay] RELAY_PRIVATE_KEY not set — using stub mode');
    return null;
  }
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    console.error('[SettlementRelay] Failed to parse RELAY_PRIVATE_KEY');
    return null;
  }
}

// ── MagicBlock API helpers ────────────────────────────────────────────────────

interface MBTxEnvelope {
  kind:                 string;
  version:              string;
  transactionBase64:    string;
  sendTo:               'base' | 'ephemeral';
  recentBlockhash:      string;
  lastValidBlockHeight: number;
  instructionCount:     number;
  requiredSigners:      string[];
  validator?:           string;
}

async function buildTransfer(params: {
  from:        string;
  to:          string;
  amount:      number;
  visibility:  'public' | 'private';
  fromBalance: 'base' | 'ephemeral';
  toBalance:   'base' | 'ephemeral';
  memo?:       string;
}): Promise<MBTxEnvelope> {
  const res = await fetch(`${PAYMENTS_API}/v1/spl/transfer`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      ...params,
      cluster:           CLUSTER,
      initAtasIfMissing: true,
      // USDC mint auto-defaults to devnet USDC on devnet cluster
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MagicBlock /v1/spl/transfer → ${res.status}: ${text}`);
  }
  return res.json() as Promise<MBTxEnvelope>;
}

async function signAndSubmit(
  envelope:  MBTxEnvelope,
  keypair:   Keypair,
): Promise<string> {
  const tx = Transaction.from(Buffer.from(envelope.transactionBase64, 'base64'));
  tx.sign(keypair);

  const rpcUrl = envelope.sendTo === 'base' ? BASE_RPC : EPHEMERAL_RPC;
  const conn   = new Connection(rpcUrl, 'confirmed');
  return conn.sendRawTransaction(tx.serialize(), { skipPreflight: false });
}

// ── Settlement logic ──────────────────────────────────────────────────────────

async function settlePendingGrants(relay: Keypair | null): Promise<void> {
  // Fetch all pending grants
  let pending: Array<{
    id: string;
    donor: string;
    npo: string;
    amountUsdc: number;
    status: string;
    purpose: string | null;
  }>;

  try {
    pending = await db.select().from(grants).where(eq(grants.status, 'advised'));
  } catch {
    return; // DB not ready yet
  }

  if (pending.length === 0) return;
  console.log(`[SettlementRelay] Processing ${pending.length} pending grant(s).`);

  for (const grant of pending) {
    try {
      const amountBaseUnits = Math.round(grant.amountUsdc * 1_000_000);
      let txSig: string;

      if (relay) {
        // ── Real MagicBlock settlement ─────────────────────────────────────
        // Step 1: Private transfer from relay ephemeral → NPO ephemeral
        const privateEnv = await buildTransfer({
          from:        relay.publicKey.toBase58(),
          to:          grant.npo,
          amount:      amountBaseUnits,
          visibility:  'private',
          fromBalance: 'ephemeral',
          toBalance:   'ephemeral',
          memo:        grant.purpose ?? `HUSH grant ${grant.id}`,
        });
        await signAndSubmit(privateEnv, relay);

        // Step 2: Public settlement — NPO ephemeral → NPO base wallet
        const settlementEnv = await buildTransfer({
          from:        relay.publicKey.toBase58(),
          to:          grant.npo,
          amount:      amountBaseUnits,
          visibility:  'public',
          fromBalance: 'ephemeral',
          toBalance:   'base',
          memo:        `Settlement: ${grant.id}`,
        });
        txSig = await signAndSubmit(settlementEnv, relay);
      } else {
        // ── Stub mode (no relay keypair) ───────────────────────────────────
        txSig = `STUB_${Date.now().toString(36).toUpperCase()}_${grant.id.slice(0, 8)}`;
        console.log(`[SettlementRelay] Stub settlement for grant ${grant.id}`);
      }

      // Mark settled in DB
      await db.update(grants)
        .set({ status: 'settled' })
        .where(eq(grants.id, grant.id));

      console.log(`[SettlementRelay] Grant ${grant.id} settled — tx: ${txSig.slice(0, 20)}…`);
    } catch (err) {
      console.error(`[SettlementRelay] Failed to settle grant ${grant.id}:`, (err as Error).message);
    }
  }
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export class SettlementRelay {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly relay: Keypair | null;

  constructor() {
    this.relay = loadRelayKeypair();
  }

  start(): void {
    console.log('[SettlementRelay] Starting — polling every 10s.');
    if (this.relay) {
      console.log(`[SettlementRelay] Relay wallet: ${this.relay.publicKey.toBase58()}`);
    } else {
      console.log('[SettlementRelay] Running in stub mode (set RELAY_PRIVATE_KEY for real settlements).');
    }

    // Run immediately, then on interval
    settlePendingGrants(this.relay).catch(console.error);
    this.timer = setInterval(
      () => settlePendingGrants(this.relay).catch(console.error),
      POLL_INTERVAL,
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[SettlementRelay] Stopped.');
  }
}
