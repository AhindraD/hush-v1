'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { shieldDeposit, type Deposit } from '@/lib/api';

// TODO: import { generateStealthAddress } from '@hush/sdk' once installed
// Stub for Umbra-style stealth address generation
async function generateStealthAddress(
  recipientPubkey: string,
  _connection: unknown,
): Promise<{ stealthPubkey: string; ephemeralKey: string }> {
  // STUB — replace with actual Umbra SDK call:
  // const { stealthAddress, ephemeralKey } = await umbraSDK.generateStealthAddress(recipientPubkey);
  console.warn('generateStealthAddress: using stub, replace with @hush/sdk');
  return {
    stealthPubkey: recipientPubkey, // placeholder
    ephemeralKey:  '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  };
}

// TODO: import { sendUsdcToStealth } from '@hush/sdk' once installed
async function sendUsdcToStealth(
  _stealthPubkey: string,
  _amount: number,
  _connection: unknown,
  _wallet: unknown,
): Promise<string> {
  // STUB — replace with actual SPL token transfer via @solana/spl-token
  console.warn('sendUsdcToStealth: using stub, replace with @hush/sdk');
  return 'STUB_TX_' + Date.now().toString(36).toUpperCase();
}

interface ShieldDepositInput {
  accountId: string;
  amount:    number;          // USDC (human-readable, e.g. 100.00)
  recipientPubkey?: string;
}

interface ShieldDepositResult {
  deposit:      Deposit;
  stealthPubkey: string;
  txHash:       string;
}

/**
 * Mutation hook to shield a USDC deposit into a HUSH account.
 * 1. Generates stealth address via Umbra SDK
 * 2. Sends USDC to stealth address on-chain
 * 3. Records the deposit in HUSH server
 */
export function useShieldDeposit() {
  const queryClient = useQueryClient();
  const wallet      = useWallet();
  const { connection } = useConnection();

  return useMutation<ShieldDepositResult, Error, ShieldDepositInput>({
    mutationFn: async ({ accountId, amount, recipientPubkey }) => {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const target = recipientPubkey ?? wallet.publicKey.toBase58();

      // Step 1: generate stealth address
      const { stealthPubkey } = await generateStealthAddress(target, connection);

      // Step 2: send USDC to stealth address on-chain
      const txHash = await sendUsdcToStealth(stealthPubkey, amount, connection, wallet);

      // Step 3: record deposit in HUSH server
      const deposit = await shieldDeposit(accountId, {
        amount:       Math.round(amount * 1_000_000), // convert to lamports
        stealthPubkey,
        txHash,
      });

      return { deposit, stealthPubkey, txHash };
    },
    onSuccess: (_, variables) => {
      // Invalidate account data to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['hush-account', variables.accountId],
      });
    },
  });
}
