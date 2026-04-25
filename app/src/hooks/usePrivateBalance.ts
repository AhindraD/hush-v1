'use client';

/**
 * usePrivateBalance.ts
 *
 * Queries the MagicBlock Ephemeral Rollup for the private USDC balance
 * of a connected wallet address.
 */

import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/providers/WalletProvider';
import { createMagicBlockClient, USDC_MINT_DEVNET } from '@hush/sdk';

export interface PrivateBalanceData {
  /** Raw balance string (e.g. "1000000" = 1 USDC) */
  rawBalance:    string;
  /** Human-readable USDC amount */
  usdcBalance:   number;
  address:       string;
}

/**
 * Polls the MagicBlock ephemeral rollup for the connected wallet's
 * private USDC balance. Refreshes every 15 seconds.
 */
export function usePrivateBalance() {
  const { publicKey, isConnected } = useWallet();

  return useQuery<PrivateBalanceData, Error>({
    queryKey:  ['private-balance', publicKey],
    queryFn:   async () => {
      if (!publicKey) throw new Error('No wallet connected');

      const client = createMagicBlockClient('devnet');
      // For PoC, we assume the wallet address itself holds the tokens in ER or we should resolve ATA
      const balance = await client.getPrivateBalance(publicKey, USDC_MINT_DEVNET.toBase58());

      return {
        rawBalance:  balance.toString(),
        usdcBalance: Number(balance) / 1_000_000,
        address:     publicKey,
      };
    },
    enabled:        isConnected && !!publicKey,
    staleTime:      15_000,
    refetchInterval: 15_000,
  });
}
