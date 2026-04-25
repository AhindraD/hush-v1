#!/usr/bin/env ts-node
/**
 * scripts/seed-demo.ts
 * Seed the SQLite database with demo stealth accounts, transactions,
 * and compliance receipts for local development / hackathon demo.
 *
 * Usage: ts-node scripts/seed-demo.ts
 *        (or via `pnpm --filter @hush/server db:seed`)
 */

import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

// ── Config ─────────────────────────────────────────────────────────────────────
const DB_PATH = path.resolve(
  process.env.DB_PATH ?? path.join(__dirname, "../data.db")
);

// ── Demo data ──────────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    id:          randomUUID(),
    stealthAddr: "5xVmP1uQ8rK3nDfT7wYhZ2cXbAeGjLsN9pRoWqHiMvC",
    viewingKey:  "vk_alpha_8f3b2a1c9e4d7f6b",
    label:       "Alpha Donor",
    balanceLamports: 500_000_000, // 0.5 SOL worth
  },
  {
    id:          randomUUID(),
    stealthAddr: "9kBnR4tW6yPmEgU2xZsD8vFhQaJoLcN5rTiHwXuVbKy",
    viewingKey:  "vk_beta_2d5e8a3f1b9c4e7d",
    label:       "Beta Donor",
    balanceLamports: 1_200_000_000, // 1.2 SOL worth
  },
];

const DEMO_GRANTS = [
  {
    id:          randomUUID(),
    requestId:   randomUUID(),
    donor:       DEMO_ACCOUNTS[0].stealthAddr,
    npo:         "GiVE4GooD_NPO_Wallet_111111111111111",
    amountUsdc:  250,
    status:      "settled",
    purpose:     "Education fund Q1",
    createdAt:   new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id:          randomUUID(),
    requestId:   randomUUID(),
    donor:       DEMO_ACCOUNTS[0].stealthAddr,
    npo:         "FoodBank_NPO_Wallet_222222222222222",
    amountUsdc:  100,
    status:      "advised",
    purpose:     "Emergency relief",
    createdAt:   new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id:          randomUUID(),
    requestId:   randomUUID(),
    donor:       DEMO_ACCOUNTS[1].stealthAddr,
    npo:         "ClimateAction_NPO_Wallet_333333333",
    amountUsdc:  500,
    status:      "settled",
    purpose:     "Carbon offset program",
    createdAt:   new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_DEPOSITS = [
  {
    id:        randomUUID(),
    account:   DEMO_ACCOUNTS[0].stealthAddr,
    amountUsdc: 750,
    txHash:    "4RmP9kXbT2wYhZ1cNdV8uFgQ3jLsK7pBoWqHiMvCxE",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id:        randomUUID(),
    account:   DEMO_ACCOUNTS[1].stealthAddr,
    amountUsdc: 1200,
    txHash:    "7YnQ2tW5rPmEgU4xZsD9vFhBaJoLcK6rTiHwXuVbKz",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Seed ───────────────────────────────────────────────────────────────────────
function seed() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  console.log("🌱 HUSH — Seeding demo data");
  console.log("  DB path :", DB_PATH);
  console.log("");

  // ── Schema (idempotent) ────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS stealth_accounts (
      id            TEXT PRIMARY KEY,
      stealth_addr  TEXT UNIQUE NOT NULL,
      viewing_key   TEXT UNIQUE NOT NULL,
      label         TEXT,
      balance_lamports INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id           TEXT PRIMARY KEY,
      account      TEXT NOT NULL,
      amount_usdc  REAL NOT NULL,
      tx_hash      TEXT NOT NULL,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grants (
      id           TEXT PRIMARY KEY,
      request_id   TEXT UNIQUE NOT NULL,
      donor        TEXT NOT NULL,
      npo          TEXT NOT NULL,
      amount_usdc  REAL NOT NULL,
      status       TEXT NOT NULL,
      purpose      TEXT,
      created_at   TEXT NOT NULL
    );
  `);

  // ── Clear existing demo rows ───────────────────────────────────────────────
  db.exec(
    "DELETE FROM stealth_accounts; DELETE FROM deposits; DELETE FROM grants;"
  );

  // ── Insert ─────────────────────────────────────────────────────────────────
  const insertAccount = db.prepare(`
    INSERT INTO stealth_accounts
      (id, stealth_addr, viewing_key, label, balance_lamports)
    VALUES (@id, @stealthAddr, @viewingKey, @label, @balanceLamports)
  `);

  const insertDeposit = db.prepare(`
    INSERT INTO deposits (id, account, amount_usdc, tx_hash, created_at)
    VALUES (@id, @account, @amountUsdc, @txHash, @createdAt)
  `);

  const insertGrant = db.prepare(`
    INSERT INTO grants
      (id, request_id, donor, npo, amount_usdc, status, purpose, created_at)
    VALUES
      (@id, @requestId, @donor, @npo, @amountUsdc, @status, @purpose, @createdAt)
  `);

  const seedAll = db.transaction(() => {
    for (const acc of DEMO_ACCOUNTS) insertAccount.run(acc);
    for (const dep of DEMO_DEPOSITS) insertDeposit.run(dep);
    for (const grant of DEMO_GRANTS) insertGrant.run(grant);
  });

  seedAll();

  console.log(`✅ Inserted ${DEMO_ACCOUNTS.length} accounts`);
  console.log(`✅ Inserted ${DEMO_DEPOSITS.length} deposits`);
  console.log(`✅ Inserted ${DEMO_GRANTS.length} grants`);
  console.log("");
  console.log("Demo viewing keys:");
  for (const acc of DEMO_ACCOUNTS) {
    console.log(`  ${acc.label.padEnd(14)} → ${acc.viewingKey}`);
  }

  db.close();
}

seed();
