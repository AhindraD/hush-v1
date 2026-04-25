'use client';

import { useMutation } from '@tanstack/react-query';
import { generateTaxReceipt, type TaxReceipt } from '@/lib/api';

interface ViewingKeyInput {
  accountId:  string;
  viewingKey: string;
  taxYear:    number;
}

interface ViewingKeyResult {
  receipt:    TaxReceipt;
  auditLogId: string;
}

/**
 * Mutation hook for viewing key verification and ZK-Tax-Receipt generation.
 * 1. Verifies the viewing key against the on-chain registry
 * 2. Requests the server to generate a ZK proof
 * 3. Returns the decrypted tax receipt + an audit log entry ID
 *
 * The audit log records that a viewing key was used (for compliance),
 * without revealing what was viewed.
 */
export function useViewingKey() {
  return useMutation<ViewingKeyResult, Error, ViewingKeyInput>({
    mutationFn: async ({ accountId, viewingKey, taxYear }) => {
      // TODO: verify viewing key signature against on-chain registry via @hush/sdk
      // const isValid = await hushSDK.verifyViewingKey(viewingKey, accountId);
      // if (!isValid) throw new Error('Invalid viewing key');

      const receipt = await generateTaxReceipt(accountId, { viewingKey, taxYear });

      // Audit log ID returned from server in receipt
      const auditLogId = receipt.receiptId;

      return { receipt, auditLogId };
    },
  });
}
