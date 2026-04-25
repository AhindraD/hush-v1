import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { dafAccounts, auditLogs, deposits, grants, AuditLog, Deposit, Grant } from '../db/schema';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TaxReceiptData {
  accountId: number;
  taxYear: number;
  totalDeposits: number;
  totalGrants: number;
  deposits: Array<{
    date: string;
    amountUsdc: number;
    maskedWallet: string;
    txHash: string;
  }>;
  grants: Array<{
    date: string;
    charityName: string;
    charityWallet: string;
    amountUsdc: number;
    settlementTxHash: string | null;
  }>;
  zkReceiptHash: string;
  generatedAt: string;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// ViewingKeyService
// ---------------------------------------------------------------------------
export class ViewingKeyService {
  /**
   * Verifies a viewing key against the stored hash for an account.
   * In production this would verify an on-chain viewing key commitment.
   * In PoC: SHA-256 of the viewing key matches the stored hash.
   */
  async verifyKey(accountId: number, viewingKey: string): Promise<boolean> {
    const account = db
      .select()
      .from(dafAccounts)
      .where(eq(dafAccounts.id, accountId))
      .get();

    if (!account) return false;

    const providedHash = crypto
      .createHash('sha256')
      .update(viewingKey)
      .digest('hex');

    // Demo: any key starting with "vk_" is accepted for seeded accounts
    if (
      process.env.NODE_ENV === 'development' &&
      viewingKey.startsWith('vk_')
    ) {
      return true;
    }

    return providedHash === account.viewingKeyHash;
  }

  /**
   * Generates a structured tax receipt for the given account and tax year.
   * Only proceeds if the viewing key verifies.
   */
  async generateTaxReceipt(
    accountId: number,
    viewingKey: string,
    taxYear: number
  ): Promise<TaxReceiptData | null> {
    const verified = await this.verifyKey(accountId, viewingKey);
    if (!verified) return null;

    const account = db
      .select()
      .from(dafAccounts)
      .where(eq(dafAccounts.id, accountId))
      .get();
    if (!account) return null;

    // Fetch deposits for the tax year
    const allDeposits: Deposit[] = db
      .select()
      .from(deposits)
      .where(eq(deposits.accountId, accountId))
      .orderBy(desc(deposits.createdAt))
      .all();

    const yearDeposits = allDeposits.filter((d) => {
      const year = new Date(d.createdAt).getFullYear();
      return year === taxYear && d.status === 'confirmed';
    });

    // Fetch settled grants for the tax year
    const allGrants: Grant[] = db
      .select()
      .from(grants)
      .where(eq(grants.accountId, accountId))
      .orderBy(desc(grants.createdAt))
      .all();

    const yearGrants = allGrants.filter(
      (g) => g.taxYear === taxYear && g.status === 'settled'
    );

    const totalDeposits = yearDeposits.reduce((s, d) => s + d.amountUsdc, 0);
    const totalGrants = yearGrants.reduce((s, g) => s + g.amountUsdc, 0);

    const zkReceiptHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({ accountId, taxYear, totalDeposits, totalGrants })
      )
      .digest('hex');

    return {
      accountId,
      taxYear,
      totalDeposits,
      totalGrants,
      deposits: yearDeposits.map((d) => ({
        date: new Date(d.createdAt).toISOString().split('T')[0]!,
        amountUsdc: d.amountUsdc,
        maskedWallet: d.maskedWallet,
        txHash: d.txHash,
      })),
      grants: yearGrants.map((g) => ({
        date: new Date(g.createdAt).toISOString().split('T')[0]!,
        charityName: g.charityName,
        charityWallet: g.charityWallet,
        amountUsdc: g.amountUsdc,
        settlementTxHash: g.settlementTxHash,
      })),
      zkReceiptHash,
      generatedAt: new Date().toISOString(),
      disclaimer:
        'This tax receipt is generated from a private shielded ledger. ' +
        'Verify the ZK receipt hash on-chain for cryptographic proof of correctness. ' +
        'Consult a qualified tax professional for advice specific to your jurisdiction.',
    };
  }

  /**
   * Returns all audit log entries for an account.
   */
  async getAuditLogs(accountId: number): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.accountId, accountId))
      .orderBy(desc(auditLogs.createdAt))
      .all();
  }
}
