'use client';

/**
 * useShieldDeposit.ts
 *
 * Mutation hook for the full HUSH deposit flow:
 *  1. Deposit USDC into Umbra encrypted balance (stealth ingress)
 *  2. Build rollup deposit transaction via MagicBlock Ephemeral Rollup
 *  3. Record the deposit in the HUSH server
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/providers/WalletProvider';
import { shieldDeposit, type Deposit } from '@/lib/api';
import { HushClient } from '@hush/sdk';
import { Transaction, PublicKey, Connection } from '@solana/web3.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShieldDepositInput {
  accountId:        string;
  amount:           number;   // USDC human-readable, e.g. 100.00
  recipientPubkey?: string;
}

interface ShieldDepositResult {
  deposit:            Deposit;
  umbraSig:           string;
  rollupDepositTx?:   Transaction;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Mutation hook to execute the HUSH shield-deposit flow.
 */
export function useShieldDeposit() {
  const queryClient                                  = useQueryClient();
  const { isConnected, publicKey, signTransaction, sendTransaction, connection }  = useWallet();

  return useMutation<ShieldDepositResult, Error, ShieldDepositInput>({
    mutationFn: async ({ accountId, amount, recipientPubkey }) => {
      if (!isConnected || !publicKey || !connection) {
        throw new Error('Wallet not connected');
      }

      const lamports = BigInt(Math.round(amount * 1_000_000));
      const owner    = recipientPubkey ? new PublicKey(recipientPubkey) : new PublicKey(publicKey);

      // Step 1: Umbra encrypted deposit (stealth ingress)
      let umbraSig = '';

      try {
        const hushClient = await HushClient.create({
          network: 'devnet',
          signer:  { publicKey: new PublicKey(publicKey) },
        });

        const shieldTx = await hushClient.shieldDeposit(lamports, owner);
        if (sendTransaction) {
            umbraSig = await sendTransaction(shieldTx, connection);
        }
      } catch (err) {
        console.warn('useShieldDeposit: Umbra flow error:', err);
      }

      // Step 2: Build MagicBlock rollup deposit (delegation)
      let rollupDepositTx: Transaction | undefined;
      try {
        const hushClient = await HushClient.create({ network: 'devnet' });
        rollupDepositTx = await hushClient.buildRollupDeposit(owner.toBase58(), lamports);
      } catch (err) {
        console.warn('useShieldDeposit: MagicBlock deposit build error:', err);
      }

      // Step 3: Record in HUSH server
      const deposit = await shieldDeposit(accountId, {
        amount:        Math.round(amount * 1_000_000),
        stealthPubkey: owner.toBase58(),
        txHash:        umbraSig || `MB_${Date.now().toString(36).toUpperCase()}`,
      });

      return { deposit, umbraSig, rollupDepositTx };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hush-account', variables.accountId] });
    },
  });
}
