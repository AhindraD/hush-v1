import cron from 'node-cron';
import { AccountService } from '../services/AccountService';
import { db } from '../db/client';
import { dafAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * YieldAgent — Runs on a cron schedule to rebalance yield positions for all
 * active DAF accounts. Simulates the on-chain AI Yield Agent that operates
 * inside a MagicBlock Private Ephemeral Rollup (PER).
 *
 * Production behaviour:
 *   - Reads live APY feeds from Kamino, Jito, Marginfi
 *   - Submits rebalance instructions via the HUSH Vault Program
 *   - Operates inside TEE / MagicBlock PER for confidentiality
 *
 * PoC behaviour:
 *   - Applies randomised APY variance to simulate live protocol rates
 *   - Accrues yield mathematically against elapsed time
 *   - Logs all activity with timestamps and protocol details
 */
export class YieldAgent {
  private task: cron.ScheduledTask | null = null;
  private accountService: AccountService;
  private isRunning = false;

  constructor() {
    this.accountService = new AccountService();
  }

  /**
   * Start the yield rebalancing cron job.
   * Schedule: every 5 minutes.
   */
  start(): void {
    if (this.task) {
      console.warn('[YieldAgent] Already started — ignoring duplicate start().');
      return;
    }

    console.log('[YieldAgent] Starting — schedule: every 5 minutes.');

    this.task = cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        console.log('[YieldAgent] Previous run still in progress, skipping.');
        return;
      }
      await this.runRebalanceCycle();
    });

    console.log('[YieldAgent] Cron job registered.');
  }

  /**
   * Stop the cron job gracefully.
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('[YieldAgent] Stopped.');
    }
  }

  /**
   * Manually trigger a rebalance cycle (useful for testing / on-demand calls).
   */
  async triggerManualRebalance(): Promise<void> {
    console.log('[YieldAgent] Manual rebalance triggered.');
    await this.runRebalanceCycle();
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async runRebalanceCycle(): Promise<void> {
    this.isRunning = true;
    const startedAt = Date.now();

    try {
      const activeAccounts = db
        .select({ id: dafAccounts.id, ownerPubkey: dafAccounts.ownerPubkey })
        .from(dafAccounts)
        .where(eq(dafAccounts.status, 'active'))
        .all();

      const n = activeAccounts.length;
      console.log(`[YieldAgent] Rebalancing ${n} active account(s) — ${new Date().toISOString()}`);

      let successCount = 0;
      let errorCount = 0;

      for (const account of activeAccounts) {
        try {
          const positions = await this.accountService.rebalanceYield(account.id);
          const activePositions = positions.filter((p) => p.isActive);

          const protocols = activePositions.map((p) => p.protocol).join(', ');
          const avgApy =
            activePositions.length > 0
              ? (
                  activePositions.reduce((s, p) => s + p.currentApy, 0) /
                  activePositions.length
                ).toFixed(2)
              : '0.00';

          console.log(
            `[YieldAgent] Account ${account.id} (${account.ownerPubkey.slice(0, 8)}...) — ` +
              `${activePositions.length} positions [${protocols}] — avg APY: ${avgApy}%`
          );

          successCount++;
        } catch (err) {
          errorCount++;
          console.error(
            `[YieldAgent] Failed to rebalance account ${account.id}:`,
            err instanceof Error ? err.message : err
          );
        }
      }

      const elapsed = Date.now() - startedAt;
      console.log(
        `[YieldAgent] Cycle complete — ${successCount} succeeded, ${errorCount} failed — ${elapsed}ms`
      );
    } catch (err) {
      console.error('[YieldAgent] Unexpected error in rebalance cycle:', err);
    } finally {
      this.isRunning = false;
    }
  }
}
