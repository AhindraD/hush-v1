'use client';

import { useQuery } from '@tanstack/react-query';
import { getAccount, type AccountData } from '@/lib/api';

/**
 * Fetches the full HUSH account data for a given accountId.
 * Includes account summary, deposits, yield positions, and grant history.
 */
export function useHushAccount(accountId: string | null | undefined) {
  const query = useQuery<AccountData, Error>({
    queryKey:  ['hush-account', accountId],
    queryFn:   () => {
      if (!accountId) throw new Error('accountId is required');
      return getAccount(accountId);
    },
    enabled:   Boolean(accountId),
    staleTime: 30 * 1000,   // 30 seconds — blockchain data changes often
    refetchInterval: 30 * 1000,
  });

  return {
    account:        query.data?.account        ?? null,
    deposits:       query.data?.deposits       ?? [],
    yieldPositions: query.data?.yieldPositions ?? [],
    grants:         query.data?.grants         ?? [],
    isLoading:      query.isLoading,
    isFetching:     query.isFetching,
    error:          query.error,
    refetch:        query.refetch,
  };
}
