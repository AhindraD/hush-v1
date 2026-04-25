'use client';

/**
 * WalletProvider.tsx
 *
 * Wallet connectivity built on gill (web3.js v2 / @solana/kit successor).
 * Uses the Wallet Standard — works with Phantom, Solflare, Backpack, and
 * any modern Solana wallet without adapter boilerplate.
 *
 * gill replaces @solana/kit as the frontend Solana client.
 * Install: pnpm add gill
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createSolanaClient,
  type KeyPairSigner,
} from 'gill';

// ── Wallet Standard shim types ────────────────────────────────────────────────
// All modern Solana wallets (Phantom, Solflare, Backpack) expose a standard
// interface via window.phantom.solana / window.solflare / etc.

interface WalletAccount {
  address:   string;
  publicKey: Uint8Array;
}

interface StandardWallet {
  name:    string;
  icon:    string;
  connect(opts?: { silent?: boolean }): Promise<{ accounts: WalletAccount[] }>;
  disconnect(): Promise<void>;
  signTransaction?:     (tx: unknown) => Promise<unknown>;
  signAllTransactions?: (txs: unknown[]) => Promise<unknown[]>;
  features: Record<string, unknown>;
}

declare global {
  interface Window {
    phantom?:  { solana?: StandardWallet };
    solflare?: StandardWallet;
    backpack?: { solana?: StandardWallet };
    solana?:   StandardWallet;
  }
}

// ── gill RPC setup ────────────────────────────────────────────────────────────

const RPC_URL: string =
  (process.env.NEXT_PUBLIC_RPC_URL as string | undefined) ??
  'https://api.devnet.solana.com';

// createSolanaClient is gill's primary RPC factory
// Returns { rpc, rpcSubscriptions, sendAndConfirmTransaction, simulateTransaction }
const solanaClient = createSolanaClient({ urlOrMoniker: RPC_URL });

// ── Context types ─────────────────────────────────────────────────────────────

export interface WalletContextValue {
  /** Base-58 public key string, or null when disconnected */
  publicKey:    string | null;
  walletName:   string | null;
  isConnected:  boolean;
  isConnecting: boolean;
  /** gill rpc client — use for all on-chain reads */
  rpc:          typeof solanaClient.rpc;
  /** Wallet sign function for legacy web3.js transactions (Anchor compat) */
  signTransaction:     ((tx: unknown) => Promise<unknown>) | null;
  signAllTransactions: ((txs: unknown[]) => Promise<unknown[]>) | null;
  connect():    Promise<void>;
  disconnect(): Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// ── Wallet detection ──────────────────────────────────────────────────────────

function detectWallet(): StandardWallet | null {
  if (typeof window === 'undefined') return null;
  return (
    window.phantom?.solana ??
    window.solflare         ??
    window.backpack?.solana ??
    window.solana           ??
    null
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey,    setPublicKey]    = useState<string | null>(null);
  const [walletName,   setWalletName]   = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletRef,    setWalletRef]    = useState<StandardWallet | null>(null);

  const connect = useCallback(async () => {
    const wallet = detectWallet();
    if (!wallet) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    setIsConnecting(true);
    try {
      const { accounts } = await wallet.connect();
      if (accounts.length === 0) throw new Error('No accounts returned');
      setPublicKey(accounts[0].address);
      setWalletName(wallet.name);
      setWalletRef(wallet);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const wallet = detectWallet();
    await wallet?.disconnect();
    setPublicKey(null);
    setWalletName(null);
    setWalletRef(null);
  }, []);

  // Silent auto-connect on mount
  useEffect(() => {
    const wallet = detectWallet();
    if (!wallet) return;
    wallet
      .connect({ silent: true })
      .then(({ accounts }) => {
        if (accounts.length > 0) {
          setPublicKey(accounts[0].address);
          setWalletName(wallet.name);
          setWalletRef(wallet);
        }
      })
      .catch(() => {/* silent connect may be rejected; that's expected */});
  }, []);

  const value: WalletContextValue = useMemo(
    () => ({
      publicKey,
      walletName,
      isConnected:  publicKey !== null,
      isConnecting,
      rpc:          solanaClient.rpc,
      signTransaction:     walletRef?.signTransaction     ? (tx) => walletRef.signTransaction!(tx) : null,
      signAllTransactions: walletRef?.signAllTransactions ? (txs) => walletRef.signAllTransactions!(txs) : null,
      connect,
      disconnect,
    }),
    [publicKey, walletName, isConnecting, walletRef, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>');
  return ctx;
}
