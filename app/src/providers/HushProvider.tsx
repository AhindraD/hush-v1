'use client';

/**
 * HushProvider.tsx
 *
 * Root context that composes WalletProvider + QueryProvider and wires
 * up a live HushClient (Umbra + MagicBlock) keyed to the connected wallet.
 *
 * The HushClient is re-created whenever the wallet public key changes.
 * It lazily creates an Umbra session if the wallet exposes a signer shim.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { WalletProvider, useWallet } from './WalletProvider';
import { QueryProvider }             from './QueryProvider';

const RPC_URL = (process.env.NEXT_PUBLIC_RPC_URL as string | undefined) ?? 'https://api.devnet.solana.com';

// ── Context ───────────────────────────────────────────────────────────────────

interface HushContextValue {
  /**
   * Anchor-compatible provider for direct on-chain calls.
   * Null when wallet is disconnected.
   */
  anchorProvider: AnchorProvider | null;
  isConnected:    boolean;
  publicKey:      string | null;
}

const HushContext = createContext<HushContextValue>({
  anchorProvider: null,
  isConnected:    false,
  publicKey:      null,
});

// ── Inner provider ────────────────────────────────────────────────────────────

function HushContextProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, isConnected, signTransaction, signAllTransactions } = useWallet();

  const anchorProvider = useMemo(() => {
    if (!isConnected || !publicKey || !signTransaction || !signAllTransactions) return null;

    const connection = new Connection(RPC_URL, 'confirmed');
    const pubkey     = new PublicKey(publicKey);

    const wallet: Wallet = {
      publicKey: pubkey,
      payer:     null as any, // Not used in browser wallet, but required by type
      signTransaction:     (tx) => signTransaction(tx) as any,
      signAllTransactions: (txs) => signAllTransactions(txs) as any,
    };

    return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  }, [isConnected, publicKey, signTransaction, signAllTransactions]);

  const value: HushContextValue = useMemo(
    () => ({
      anchorProvider,
      isConnected,
      publicKey,
    }),
    [anchorProvider, isConnected, publicKey],
  );

  return (
    <HushContext.Provider value={value}>
      {children}
    </HushContext.Provider>
  );
}

// ── Root provider ─────────────────────────────────────────────────────────────

export function HushProvider({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <QueryProvider>
        <HushContextProvider>{children}</HushContextProvider>
      </QueryProvider>
    </WalletProvider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHushContext(): HushContextValue {
  const ctx = useContext(HushContext);
  if (!ctx) throw new Error('useHushContext must be used within <HushProvider>');
  return ctx;
}
