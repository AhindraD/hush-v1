import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import {
  dafAccounts,
  deposits,
  grants,
  yieldPositions,
  auditLogs,
  DafAccount,
  Deposit,
  Grant,
  YieldPosition,
  AuditLog,
} from '../db/schema';
import { ViewingKeyService } from './ViewingKeyService';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DepositResult {
  deposit: Deposit;
  stealthPubkey: string;
  txHash: string;
}

export interface GrantInput {
  charityWallet: string;
  charityName: string;
  amountUsdc: number;
  taxYear: number;
  encryptedMemo?: string;
}

export interface GrantResult {
  grant: Grant;
}

export interface AuditResult {
  account: DafAccount;
  deposits: Deposit[];
  grants: Grant[];
  totalDeposited: number;
  totalGranted: number;
  taxYear: number;
  zkReceiptHash: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// AccountService
// ---------------------------------------------------------------------------
export class AccountService {
  private viewingKeyService: ViewingKeyService;

  constructor() {
    this.viewingKeyService = new ViewingKeyService();
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  getAccount(id: number): DafAccount | undefined {
    return db
      .select()
      .from(dafAccounts)
      .where(eq(dafAccounts.id, id))
      .get();
  }

  getAllAccounts(): DafAccount[] {
    return db.select().from(dafAccounts).all();
  }

  getDeposits(accountId: number): Deposit[] {
    return db
      .select()
      .from(deposits)
      .where(eq(deposits.accountId, accountId))
      .orderBy(desc(deposits.createdAt))
      .all();
  }

  getGrants(accountId: number): Grant[] {
    return db
      .select()
      .from(grants)
      .where(eq(grants.accountId, accountId))
      .orderBy(desc(grants.createdAt))
      .all();
  }

  getYieldPositions(accountId: number): YieldPosition[] {
    return db
      .select()
      .from(yieldPositions)
      .where(eq(yieldPositions.accountId, accountId))
      .all();
  }

  getAuditLogs(accountId: number): AuditLog[] {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.accountId, accountId))
      .orderBy(desc(auditLogs.createdAt))
      .all();
  }

  // -------------------------------------------------------------------------
  // createDeposit
  // -------------------------------------------------------------------------

  async createDeposit(
    accountId: number,
    amountUsdc: number
  ): Promise<DepositResult> {
    const account = this.getAccount(accountId);
    if (!account) throw new Error(`Account ${accountId} not found`);

    // Generate random stealth pubkey (simulated ECDH output)
    const stealthPubkey = this.generateStealthPubkey();
    const maskedWallet = this.maskWallet(account.ownerPubkey);
    const txHash = this.generateTxHash();

    const [deposit] = db
      .insert(deposits)
      .values({
        accountId,
        amountUsdc,
        stealthPubkey,
        maskedWallet,
        txHash,
        status: 'confirmed',
      })
      .returning()
      .all();

    // Update account balance
    db.update(dafAccounts)
      .set({
        balanceUsdc: account.balanceUsdc + amountUsdc,
        totalDeposited: account.totalDeposited + amountUsdc,
        updatedAt: new Date(),
      })
      .where(eq(dafAccounts.id, accountId))
      .run();

    console.log(
      `[AccountService] Deposit created: ${amountUsdc} USDC for account ${accountId} (stealth: ${stealthPubkey.slice(0, 16)}...)`
    );

    return { deposit: deposit!, stealthPubkey, txHash };
  }

  // -------------------------------------------------------------------------
  // createGrant
  // -------------------------------------------------------------------------

  async createGrant(
    accountId: number,
    data: GrantInput
  ): Promise<GrantResult> {
    const account = this.getAccount(accountId);
    if (!account) throw new Error(`Account ${accountId} not found`);
    if (account.status !== 'active')
      throw new Error(`Account ${accountId} is not active`);
    if (account.balanceUsdc < data.amountUsdc) {
      throw new Error(
        `Insufficient balance. Available: ${account.balanceUsdc} USDC, requested: ${data.amountUsdc} USDC`
      );
    }

    const grantRequestPda = this.generateGrantPda(accountId, data.charityWallet);

    const [grant] = db
      .insert(grants)
      .values({
        accountId,
        charityWallet: data.charityWallet,
        charityName: data.charityName,
        amountUsdc: data.amountUsdc,
        grantRequestPda,
        status: 'pending',
        taxYear: data.taxYear,
        encryptedMemo: data.encryptedMemo ?? null,
        scheduledAt: new Date(),
      })
      .returning()
      .all();

    // Deduct balance immediately (reserve funds)
    db.update(dafAccounts)
      .set({
        balanceUsdc: account.balanceUsdc - data.amountUsdc,
        totalGranted: account.totalGranted + data.amountUsdc,
        updatedAt: new Date(),
      })
      .where(eq(dafAccounts.id, accountId))
      .run();

    // Schedule async settlement via SettlementRelay (simulated)
    setTimeout(async () => {
      try {
        await this.settleGrant(grant!.id);
      } catch (err) {
        console.error(`[AccountService] Settlement failed for grant ${grant!.id}:`, err);
      }
    }, 1000);

    console.log(
      `[AccountService] Grant created: ${data.amountUsdc} USDC to ${data.charityName} (PDA: ${grantRequestPda.slice(0, 16)}...)`
    );

    return { grant: grant! };
  }

  // -------------------------------------------------------------------------
  // settleGrant — called by SettlementRelay
  // -------------------------------------------------------------------------

  async settleGrant(grantId: number): Promise<void> {
    const grant = db
      .select()
      .from(grants)
      .where(eq(grants.id, grantId))
      .get();

    if (!grant || grant.status === 'settled') return;

    const settlementTxHash = this.generateTxHash();

    db.update(grants)
      .set({
        status: 'settled',
        settlementTxHash,
        settledAt: new Date(),
      })
      .where(eq(grants.id, grantId))
      .run();

    console.log(
      `[AccountService] Grant ${grantId} settled: ${settlementTxHash.slice(0, 16)}...`
    );
  }

  // -------------------------------------------------------------------------
  // rebalanceYield
  // -------------------------------------------------------------------------

  async rebalanceYield(accountId: number): Promise<YieldPosition[]> {
    const account = this.getAccount(accountId);
    if (!account) throw new Error(`Account ${accountId} not found`);

    const positions = this.getYieldPositions(accountId);
    const now = new Date();

    let totalNewYield = 0;

    for (const position of positions) {
      if (!position.isActive) continue;

      // Apply small APY variance (±0.25% to simulate live protocol rates)
      const variance = (Math.random() - 0.5) * 0.5;
      const newApy = Math.max(1, position.currentApy + variance);

      // Accrue yield since last rebalance (hourly approximation)
      const hoursSinceRebalance =
        (now.getTime() - position.lastRebalancedAt.getTime()) / (1000 * 60 * 60);
      const yieldDelta =
        (position.allocatedUsdc * (newApy / 100) * hoursSinceRebalance) / 8760;
      const newAccruedYield = position.accruedYield + yieldDelta;

      db.update(yieldPositions)
        .set({
          currentApy: parseFloat(newApy.toFixed(4)),
          accruedYield: parseFloat(newAccruedYield.toFixed(6)),
          lastRebalancedAt: now,
        })
        .where(eq(yieldPositions.id, position.id))
        .run();

      totalNewYield += yieldDelta;
    }

    // Update account total yield
    db.update(dafAccounts)
      .set({
        totalYieldAccrued: account.totalYieldAccrued + totalNewYield,
        updatedAt: now,
      })
      .where(eq(dafAccounts.id, accountId))
      .run();

    console.log(
      `[AccountService] Rebalanced ${positions.length} yield positions for account ${accountId}. New yield: +${totalNewYield.toFixed(4)} USDC`
    );

    return this.getYieldPositions(accountId);
  }

  // -------------------------------------------------------------------------
  // generateAuditLog
  // -------------------------------------------------------------------------

  async generateAuditLog(
    accountId: number,
    viewingKey: string,
    taxYear: number,
    requestedBy: string = 'user',
    ipAddress?: string
  ): Promise<AuditResult | null> {
    const verified = await this.viewingKeyService.verifyKey(accountId, viewingKey);
    if (!verified) return null;

    const account = this.getAccount(accountId);
    if (!account) return null;

    const allDeposits = this.getDeposits(accountId);
    const yearDeposits = allDeposits.filter(
      (d) =>
        d.status === 'confirmed' &&
        new Date(d.createdAt).getFullYear() === taxYear
    );

    const allGrants = this.getGrants(accountId);
    const yearGrants = allGrants.filter(
      (g) =>
        g.status === 'settled' &&
        g.taxYear === taxYear
    );

    const totalDeposited = yearDeposits.reduce((sum, d) => sum + d.amountUsdc, 0);
    const totalGranted = yearGrants.reduce((sum, g) => sum + g.amountUsdc, 0);

    const zkReceiptHash = crypto
      .createHash('sha256')
      .update(
        `${accountId}:${taxYear}:${totalDeposited}:${totalGranted}:${Date.now()}`
      )
      .digest('hex');

    // Persist audit log entry
    db.insert(auditLogs)
      .values({
        accountId,
        viewingKeyHash: crypto
          .createHash('sha256')
          .update(viewingKey)
          .digest('hex'),
        requestedBy,
        taxYear,
        disclosureScope: 'full',
        totalDeposits: totalDeposited,
        totalGrants: totalGranted,
        zkReceiptHash,
        ipAddress: ipAddress ?? null,
      })
      .run();

    return {
      account,
      deposits: yearDeposits,
      grants: yearGrants,
      totalDeposited,
      totalGranted,
      taxYear,
      zkReceiptHash,
      generatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private generateStealthPubkey(): string {
    return 'stealth' + crypto.randomBytes(16).toString('hex');
  }

  private maskWallet(pubkey: string): string {
    return pubkey.slice(0, 4) + '...' + pubkey.slice(-3);
  }

  private generateTxHash(): string {
    return crypto.randomBytes(32).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
  }

  private generateGrantPda(accountId: number, charityWallet: string): string {
    return crypto
      .createHash('sha256')
      .update(`grant:${accountId}:${charityWallet}:${Date.now()}`)
      .digest('hex')
      .slice(0, 44);
  }
}
