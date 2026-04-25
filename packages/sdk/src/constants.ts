import { PublicKey } from '@solana/web3.js';

export const HUSH_PROGRAM_ID = new PublicKey('HUSHvau1tXGqT1nFDUzGJpyvT1CYS8yEQV8X5LmHHu1');
export const HUSH_VAULT_SEED = Buffer.from('hush_vault');
export const SHIELDED_ACCOUNT_SEED = Buffer.from('shielded');
export const GRANT_SEED = Buffer.from('grant');

export const MAGICBLOCK_RPC = 'https://devnet.magicblock.app';
export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';

export const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export const YIELD_PROTOCOL_LABELS: Record<number, string> = {
  0: 'Kamino Finance',
  1: 'Jito LST',
  2: 'Marginfi',
  3: 'Drift',
};

export const YIELD_PROTOCOL_APYS: Record<number, number> = {
  0: 8.21,
  1: 6.89,
  2: 5.44,
  3: 7.12,
};
