'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adviseGrant, type Grant } from '@/lib/api';

interface AdviseGrantInput {
  accountId:      string;
  charityName:    string;
  charityAddress: string;
  amount:         number;   // USDC human-readable
  memo:           string;
}

/**
 * Mutation hook to advise a grant from a HUSH account.
 * Posts the grant instruction to the server, which routes it through
 * MagicBlock ephemeral rollup for private execution.
 */
export function useAdviseGrant() {
  const queryClient = useQueryClient();

  return useMutation<Grant, Error, AdviseGrantInput>({
    mutationFn: async ({ accountId, charityName, charityAddress, amount, memo }) => {
      return adviseGrant(accountId, {
        charityName,
        charityAddress,
        amount: Math.round(amount * 1_000_000), // USDC lamports
        memo,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['hush-account', variables.accountId],
      });
    },
  });
}
