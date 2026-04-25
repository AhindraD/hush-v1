import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { seedDemoData } from './seed';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data.db');

// ---------------------------------------------------------------------------
// SQLite connection
// ---------------------------------------------------------------------------
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('synchronous = NORMAL');

// ---------------------------------------------------------------------------
// Drizzle ORM instance
// ---------------------------------------------------------------------------
export const db = drizzle(sqlite, { schema });

// ---------------------------------------------------------------------------
// Migrations — CREATE TABLE IF NOT EXISTS
// ---------------------------------------------------------------------------
export function runMigrations(): void {
  console.log('[db] Running migrations...');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS daf_accounts (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_pubkey        TEXT    NOT NULL UNIQUE,
      stealth_meta_address TEXT   NOT NULL,
      viewing_key_hash    TEXT    NOT NULL,
      encrypted_balance   TEXT    NOT NULL DEFAULT '0',
      balance_usdc        REAL    NOT NULL DEFAULT 0,
      total_deposited     REAL    NOT NULL DEFAULT 0,
      total_granted       REAL    NOT NULL DEFAULT 0,
      total_yield_accrued REAL    NOT NULL DEFAULT 0,
      status              TEXT    NOT NULL DEFAULT 'active'
                            CHECK(status IN ('active','frozen','closed')),
      created_at          INTEGER NOT NULL,
      updated_at          INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id      INTEGER NOT NULL REFERENCES daf_accounts(id),
      amount_usdc     REAL    NOT NULL,
      stealth_pubkey  TEXT    NOT NULL,
      masked_wallet   TEXT    NOT NULL,
      tx_hash         TEXT    NOT NULL UNIQUE,
      block_height    INTEGER,
      status          TEXT    NOT NULL DEFAULT 'confirmed'
                        CHECK(status IN ('pending','confirmed','failed')),
      encrypted_memo  TEXT,
      created_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grants (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id          INTEGER NOT NULL REFERENCES daf_accounts(id),
      charity_wallet      TEXT    NOT NULL,
      charity_name        TEXT    NOT NULL,
      amount_usdc         REAL    NOT NULL,
      grant_request_pda   TEXT,
      settlement_tx_hash  TEXT,
      status              TEXT    NOT NULL DEFAULT 'pending'
                            CHECK(status IN ('pending','processing','settled','failed')),
      encrypted_memo      TEXT,
      tax_year            INTEGER NOT NULL,
      scheduled_at        INTEGER,
      settled_at          INTEGER,
      created_at          INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS yield_positions (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id          INTEGER NOT NULL REFERENCES daf_accounts(id),
      protocol            TEXT    NOT NULL
                            CHECK(protocol IN ('kamino','jito','marginfi','drift','solend')),
      allocated_usdc      REAL    NOT NULL,
      current_apy         REAL    NOT NULL,
      accrued_yield       REAL    NOT NULL DEFAULT 0,
      position_address    TEXT,
      is_active           INTEGER NOT NULL DEFAULT 1,
      last_rebalanced_at  INTEGER NOT NULL,
      created_at          INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id        INTEGER NOT NULL REFERENCES daf_accounts(id),
      viewing_key_hash  TEXT    NOT NULL,
      requested_by      TEXT    NOT NULL,
      tax_year          INTEGER NOT NULL,
      disclosure_scope  TEXT    NOT NULL DEFAULT 'full'
                          CHECK(disclosure_scope IN ('deposits_only','grants_only','full')),
      total_deposits    REAL,
      total_grants      REAL,
      zk_receipt_hash   TEXT,
      ip_address        TEXT,
      created_at        INTEGER NOT NULL
    );
  `);

  // Indexes for common query patterns
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_deposits_account_id ON deposits(account_id);
    CREATE INDEX IF NOT EXISTS idx_grants_account_id ON grants(account_id);
    CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
    CREATE INDEX IF NOT EXISTS idx_yield_positions_account_id ON yield_positions(account_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_account_id ON audit_logs(account_id);
  `);

  console.log('[db] Migrations complete.');
}

// ---------------------------------------------------------------------------
// Initialize: run migrations then seed if needed
// ---------------------------------------------------------------------------
export async function initializeDatabase(): Promise<void> {
  runMigrations();
  await seedDemoData();
}

export { sqlite };
