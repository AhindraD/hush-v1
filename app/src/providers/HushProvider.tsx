'use client';

import { createContext, useContext, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { WalletProvider } from './WalletProvider';
import { QueryProvider } from './QueryProvider';

// TODO: import { HushProgram } from '@hush/sdk' once package is installed
// For now, we expose the raw AnchorProvider
interface HushContextValue {
  anchorProvider: AnchorProvider | null;
  isConnected: boolean;
  publicKey: string | null;
}

const HushContext = createContext<HushContextValue>({
  anchorProvider: null,
  isConnected:    false,
  publicKey:      null,
});

function HushContextProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const wallet         = useWallet();

  const anchorProvider = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    return new AnchorProvider(
      connection,
      {
        publicKey:       wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions!,
      },
      { commitment: 'confirmed' },
    );
  }, [connection, wallet.connected, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  const value: HushContextValue = useMemo(
    () => ({
      anchorProvider,
      isConnected: wallet.connected,
      publicKey:   wallet.publicKey?.toBase58() ?? null,
    }),
    [anchorProvider, wallet.connected, wallet.publicKey],
  );

  return <HushContext.Provider value={value}>{children}</HushContext.Provider>;
}

/**
 * Root provider that composes Wallet + Query + Hush context.
 */
export function HushProvider({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <QueryProvider>
        <HushContextProvider>{children}</HushContextProvider>
      </QueryProvider>
    </WalletProvider>
  );
}

/**
 * Consume the Hush context. Must be used inside <HushProvider>.
 */
export function useHushContext(): HushContextValue {
  const ctx = useContext(HushContext);
  if (!ctx) {
    throw new Error('useHushContext must be used within <HushProvider>');
  }
  return ctx;
}
