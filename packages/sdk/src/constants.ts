/**
 * constants.ts — Program addresses, RPC endpoints, mint addresses.
 * Single source of truth for all hard-coded values in the HUSH SDK.
 */

import { PublicKey } from '@solana/web3.js';

// ── Program ───────────────────────────────────────────────────────────────────
export const HUSH_PROGRAM_ID = new PublicKey(
  'HUSHvau1tXGqT1nFDUzGJpyvT1CYS8yEQV8X5LmHHu1',
);

// ── PDA Seeds ─────────────────────────────────────────────────────────────────
export const SEED_VAULT    = Buffer.from('hush_vault');
export const SEED_SHIELDED = Buffer.from('shielded');
export const SEED_GRANT    = Buffer.from('grant');

// ── USDC Mints ────────────────────────────────────────────────────────────────
export const USDC_MINT_MAINNET = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
);
export const USDC_MINT_DEVNET = new PublicKey(
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
);

// ── Solana RPC ────────────────────────────────────────────────────────────────
export const SOLANA_DEVNET_RPC  = 'https://api.devnet.solana.com';
export const SOLANA_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

// ── MagicBlock Private Payments API ──────────────────────────────────────────
/** Base URL for the MagicBlock Private Payments REST API */
export const MAGICBLOCK_PAYMENTS_API = 'https://payments.magicblock.app';

/** MagicBlock Ephemeral Rollup RPC endpoints */
export const MAGICBLOCK_RPC = {
  devnet:    'https://devnet.magicblock.app',
  'devnet-tee': 'https://devnet-tee.magicblock.app',
  mainnet:   'https://mainnet.magicblock.app',
  'mainnet-tee': 'https://mainnet-tee.magicblock.app',
  localnet:  'http://localhost:7799',
} as const;

/** MagicBlock Validator identities */
export const MAGICBLOCK_VALIDATORS = {
  'mainnet-asia': 'MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57',
  'mainnet-eu':   'MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e',
  'mainnet-us':   'MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd',
  'mainnet-tee':  'MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo',
  localnet:       'mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev',
} as const;

/** MagicBlock on-chain program IDs */
export const MAGICBLOCK_PROGRAMS = {
  permission:  new PublicKey('ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1'),
  delegation:  new PublicKey('DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh'),
} as const;

// ── Umbra ─────────────────────────────────────────────────────────────────────
export const UMBRA_INDEXER_API  = 'https://utxo-indexer.api.umbraprivacy.com';
export const UMBRA_RELAYER_API  = 'https://relayer.api.umbraprivacy.com';

// ── Misc ──────────────────────────────────────────────────────────────────────
export const LAMPORTS_PER_USDC = 1_000_000n; // USDC has 6 decimals
