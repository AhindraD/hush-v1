import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// dafAccounts — Donor-Advised Fund accounts
// ---------------------------------------------------------------------------
export const dafAccounts = sqliteTable('daf_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerPubkey: text('owner_pubkey').notNull().unique(),
  stealthMetaAddress: text('stealth_meta_address').notNull(),
  viewingKeyHash: text('viewing_key_hash').notNull(),
  encryptedBalance: text('encrypted_balance').notNull().default('0'),
  balanceUsdc: real('balance_usdc').notNull().default(0),
  totalDeposited: real('total_deposited').notNull().default(0),
  totalGranted: real('total_granted').notNull().default(0),
  totalYieldAccrued: real('total_yield_accrued').notNull().default(0),
  status: text('status', { enum: ['active', 'frozen', 'closed'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertDafAccountSchema = createInsertSchema(dafAccounts);
export const selectDafAccountSchema = createSelectSchema(dafAccounts);
export type DafAccount = typeof dafAccounts.$inferSelect;
export type NewDafAccount = typeof dafAccounts.$inferInsert;

// ---------------------------------------------------------------------------
// deposits — Shielded USDC deposits
// ---------------------------------------------------------------------------
export const deposits = sqliteTable('deposits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id')
    .notNull()
    .references(() => dafAccounts.id),
  amountUsdc: real('amount_usdc').notNull(),
  stealthPubkey: text('stealth_pubkey').notNull(),
  maskedWallet: text('masked_wallet').notNull(),
  txHash: text('tx_hash').notNull().unique(),
  blockHeight: integer('block_height'),
  status: text('status', { enum: ['pending', 'confirmed', 'failed'] })
    .notNull()
    .default('confirmed'),
  encryptedMemo: text('encrypted_memo'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertDepositSchema = createInsertSchema(deposits, {
  amountUsdc: z.number().positive('Amount must be positive'),
});
export const selectDepositSchema = createSelectSchema(deposits);
export type Deposit = typeof deposits.$inferSelect;
export type NewDeposit = typeof deposits.$inferInsert;

// ---------------------------------------------------------------------------
// grants — Private grant advisories
// ---------------------------------------------------------------------------
export const grants = sqliteTable('grants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id')
    .notNull()
    .references(() => dafAccounts.id),
  charityWallet: text('charity_wallet').notNull(),
  charityName: text('charity_name').notNull(),
  amountUsdc: real('amount_usdc').notNull(),
  grantRequestPda: text('grant_request_pda'),
  settlementTxHash: text('settlement_tx_hash'),
  status: text('status', {
    enum: ['pending', 'processing', 'settled', 'failed'],
  })
    .notNull()
    .default('pending'),
  encryptedMemo: text('encrypted_memo'),
  taxYear: integer('tax_year').notNull(),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  settledAt: integer('settled_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertGrantSchema = createInsertSchema(grants, {
  amountUsdc: z.number().positive('Grant amount must be positive'),
  charityWallet: z.string().min(32, 'Invalid wallet address'),
  charityName: z.string().min(1, 'Charity name required'),
});
export const selectGrantSchema = createSelectSchema(grants);
export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;

// ---------------------------------------------------------------------------
// yieldPositions — Active yield protocol allocations
// ---------------------------------------------------------------------------
export const yieldPositions = sqliteTable('yield_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id')
    .notNull()
    .references(() => dafAccounts.id),
  protocol: text('protocol', {
    enum: ['kamino', 'jito', 'marginfi', 'drift', 'solend'],
  }).notNull(),
  allocatedUsdc: real('allocated_usdc').notNull(),
  currentApy: real('current_apy').notNull(),
  accruedYield: real('accrued_yield').notNull().default(0),
  positionAddress: text('position_address'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastRebalancedAt: integer('last_rebalanced_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertYieldPositionSchema = createInsertSchema(yieldPositions);
export const selectYieldPositionSchema = createSelectSchema(yieldPositions);
export type YieldPosition = typeof yieldPositions.$inferSelect;
export type NewYieldPosition = typeof yieldPositions.$inferInsert;

// ---------------------------------------------------------------------------
// auditLogs — Viewing key audit trail
// ---------------------------------------------------------------------------
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id')
    .notNull()
    .references(() => dafAccounts.id),
  viewingKeyHash: text('viewing_key_hash').notNull(),
  requestedBy: text('requested_by').notNull(),
  taxYear: integer('tax_year').notNull(),
  disclosureScope: text('disclosure_scope', {
    enum: ['deposits_only', 'grants_only', 'full'],
  })
    .notNull()
    .default('full'),
  totalDeposits: real('total_deposits'),
  totalGrants: real('total_grants'),
  zkReceiptHash: text('zk_receipt_hash'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const selectAuditLogSchema = createSelectSchema(auditLogs);
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
