/**
 * @hush/sdk — Public exports
 *
 * Entry point for the HUSH SDK. Re-exports the high-level client
 * plus lower-level Umbra and MagicBlock helpers for direct use.
 */

// High-level client
export { HushClient, type HushClientOptions, type HushNetwork } from './hush-client';

// Umbra Privacy SDK wrapper
export {
  HushUmbraSession,
  type UmbraNetwork,
} from './umbra';

// MagicBlock Ephemeral Rollup client
export {
  HushMagicBlockClient,
  createMagicBlockClient,
  type MBCluster,
} from './magicblock';

// Constants
export {
  HUSH_PROGRAM_ID,
  SEED_VAULT,
  SEED_SHIELDED,
  SEED_GRANT,
  USDC_MINT_MAINNET,
  USDC_MINT_DEVNET,
  MAGICBLOCK_RPC,
  MAGICBLOCK_VALIDATORS,
  MAGICBLOCK_PROGRAMS,
  UMBRA_INDEXER_API,
  UMBRA_RELAYER_API,
  LAMPORTS_PER_USDC,
} from './constants';
