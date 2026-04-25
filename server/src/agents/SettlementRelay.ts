import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { grants } from '../db/schema';
import { AccountService } from '../services/AccountService';
import crypto from 'crypto';

/**
 * SettlementRelay — Watches for pending grants and settles them.
 *
 * Production behaviour:
 *   - Watches on-chain GrantRequest PDA queue via Solana subscription
 *   - Calls settle_grant instruction on the HUSH Vault Program
 *   - Relayer is permissionless — anyone can relay (anti-censorship)
 *
 * PoC behaviour:
 *   - Polls the SQLite grants table every 10 seconds
 *   - Simulates on-chain settlement with a random tx hash
 *   - Processes 'pending' and 'processing' grants in order
 */
export class SettlementRelay {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private accountService: AccountService;
  private isProcessing = false;

  /** Poll interval in milliseconds */
  private readonly POLL_INTERVAL_MS = 10_000;

  /** Max grants to process per cycle (prevents runaway loops) */
  private readonly BATCH_SIZE = 10;

  constructor() {
    this.accountService = new AccountService();
  }

  /**
   * Start the settlement relay polling loop.
   */
  start(): void {
    if (this.intervalHandle) {
      console.warn('[SettlementRelay] Already started — ignoring duplicate start().');
      return;
    }

    console.log(
      `[SettlementRelay] Starting — polling every ${this.POLL_INTERVAL_MS / 1000}s.`
    );

    // Run immediately on startup, then on interval
    void this.processPendingGrants();
    this.intervalHandle = setInterval(
      () => void this.processPendingGrants(),
      this.POLL_INTERVAL_MS
    );
  }

  /**
   * Stop the settlement relay.
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[SettlementRelay] Stopped.');
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Process all pending grants up to BATCH_SIZE.
   */
  private async processPendingGrants(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingGrants = db
        .select()
        .from(grants)
        .where(inArray(grants.status, ['pending', 'processing']))
        .limit(this.BATCH_SIZE)
        .all();

      if (pendingGrants.length === 0) {
        return; // Nothing to do
      }

      console.log(
        `[SettlementRelay] Processing ${pendingGrants.length} pending grant(s).`
      );

      for (const grant of pendingGrants) {
        try {
          await this.simulateOnChainSettlement(grant.id, grant.accountId);
        } catch (err) {
          console.error(
            `[SettlementRelay] Failed to settle grant ${grant.id}:`,
            err instanceof Error ? err.message : err
          );

          // Mark as failed after repeated error (simplified — production would
          // track retry count)
          db.update(grants)
            .set({ status: 'failed' })
            .where(eq(grants.id, grant.id))
            .run();
        }
      }
    } catch (err) {
      console.error('[SettlementRelay] Unexpected error:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Simulate the on-chain settlement of a single grant.
   *
   * In production this would:
   *   1. Fetch the GrantRequest PDA from chain
   *   2. Build and sign a settle_grant instruction
   *   3. Submit to Solana and confirm
   *   4. Update the grant record with the settlement tx hash
   */
  private async simulateOnChainSettlement(
    grantId: number,
    _accountId: number
  ): Promise<void> {
    // Mark as processing
    db.update(grants)
      .set({ status: 'processing' })
      .where(eq(grants.id, grantId))
      .run();

    // Simulate network latency (100-500ms)
    const delay = 100 + Math.random() * 400;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));

    const settlementTxHash = this.generateSettlementTxHash();

    db.update(grants)
      .set({
        status: 'settled',
        settlementTxHash,
        settledAt: new Date(),
      })
      .where(eq(grants.id, grantId))
      .run();

    console.log(
      `[SettlementRelay] Grant ${grantId} settled — tx: ${settlementTxHash.slice(0, 16)}...`
    );
  }

  private generateSettlementTxHash(): string {
    return crypto
      .randomBytes(32)
      .toString('base64url')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 44);
  }
}
