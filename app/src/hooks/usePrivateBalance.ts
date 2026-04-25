'use client';

/**
 * usePrivateBalance.ts
 *
 * Queries the MagicBlock Private Payments API for the ephemeral rollup
 * (private) USDC balance of a connected wallet address.
 *
 * Uses the real MagicBlock REST API: GET /v1/spl/private-balance
 */

import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/providers/WalletProvider';
import { createPrivatePaymentsClient } from '@hush/sdk';

export interface PrivateBalanceData {
  /** Raw balance string from the API (e.g. "1000000" = 1 USDC) */
  rawBalance:    string;
  /** Human-readable USDC amount */
  usdcBalance:   number;
  address:       string;
  location:      'base' | 'ephemeral';
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

      const client = createPrivatePaymentsClient({ cluster: 'devnet' });
      const data   = await client.getPrivateBalance(publicKey);

      return {
        rawBalance:  data.balance,
        usdcBalance: Number(data.balance) / 1_000_000,
        address:     data.address,
        location:    data.location,
      };
    },
    enabled:        isConnected && !!publicKey,
    staleTime:      15_000,
    refetchInterval: 15_000,
  });
}
