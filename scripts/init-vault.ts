#!/usr/bin/env ts-node
/**
 * scripts/init-vault.ts
 * Initialize the on-chain HushVault PDA after first deploy.
 * Usage: ts-node scripts/init-vault.ts [--cluster devnet|localnet]
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import path from "path";

// ── Config ─────────────────────────────────────────────────────────────────────
const CLUSTER =
  process.argv.includes("--cluster")
    ? process.argv[process.argv.indexOf("--cluster") + 1]
    : "devnet";

const RPC_MAP: Record<string, string> = {
  localnet: "http://127.0.0.1:8899",
  devnet:   "https://api.devnet.solana.com",
};

const PROGRAM_ID = new PublicKey(
  "HUSHvau1tXGqT1nFDUzGJpyvT1CYS8yEQV8X5LmHHu1"
);

// ── IDL ────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const idl = require("../target/idl/hush.json");

// ── Wallet ─────────────────────────────────────────────────────────────────────
const walletPath = path.resolve(
  process.env.ANCHOR_WALLET ?? path.join(homedir(), ".config/solana/id.json")
);
const keypairBytes = Uint8Array.from(
  JSON.parse(readFileSync(walletPath, "utf8"))
);
const keypair = anchor.web3.Keypair.fromSecretKey(keypairBytes);

async function main() {
  const connection = new anchor.web3.Connection(
    RPC_MAP[CLUSTER] ?? RPC_MAP.devnet
  );
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new Program(idl, PROGRAM_ID, provider);

  // Derive vault PDA
  const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("hush_vault"), keypair.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("🔒 HUSH — Initialize Vault");
  console.log("  Cluster   :", CLUSTER);
  console.log("  Authority :", keypair.publicKey.toBase58());
  console.log("  Vault PDA :", vaultPda.toBase58());
  console.log("");

  // Check if already initialized
  const existing = await connection.getAccountInfo(vaultPda);
  if (existing !== null) {
    console.log("⚠️  Vault already initialized — skipping.");
    return;
  }

  const tx = await (program.methods as any)
    .initializeVault()
    .accounts({
      vault:     vaultPda,
      authority: keypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Vault initialized.");
  console.log("   Tx :", tx);
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});
