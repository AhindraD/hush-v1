'use client';

import Link from 'next/link';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useWallet } from '@/providers/WalletProvider';
import { cn } from '@/lib/utils';

interface TopBarProps {
  accountId?: string;
}

// ── Custom X (formerly Twitter) Logo ──────────────────────────────────────────
function XLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      aria-hidden="true"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
    </svg>
  );
}

// ── Wallet connect / disconnect button ────────────────────────────────────────
function WalletButton() {
  const { isConnected, isConnecting, publicKey, walletName, connect, disconnect } =
    useWallet();

  if (isConnecting) {
    return (
      <button
        disabled
        className="btn-ghost flex items-center gap-2 px-3 py-1.5 text-sm opacity-60 cursor-not-allowed"
      >
        <Loader2 size={14} className="animate-spin" />
        Connecting…
      </button>
    );
  }

  if (isConnected && publicKey) {
    const short = publicKey.slice(0, 4) + '…' + publicKey.slice(-4);
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-xs font-mono text-[--text-secondary] bg-hush-bg-elevated px-2.5 py-1.5 rounded-md border border-[--border-subtle]">
          {walletName ? `${walletName} · ` : ''}{short}
        </span>
        <button
          onClick={disconnect}
          className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-sm"
          aria-label="Disconnect wallet"
          title="Disconnect"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  if (isConnected) return null;

  return (
    <button
      onClick={connect}
      className="btn-primary flex items-center gap-2 px-3.5 py-1.5 text-sm"
      aria-label="Connect wallet"
    >
      <Wallet size={14} />
      Connect Wallet
    </button>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
export function TopBar({ accountId }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-hush-bg-border bg-hush-bg-surface/80 backdrop-blur-md flex items-center px-6 gap-4">
      {/* Brand */}
      <Link
        href={accountId ? `/dashboard/${accountId}` : '/'}
        className="flex items-center gap-2.5 mr-auto group transition-transform duration-200 hover:scale-[1.02]"
        aria-label="HUSH home"
      >
        <div className="transition-transform duration-300 group-hover:rotate-12">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 shrink-0"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="shield-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <path
              d="M16 3L4 8v8c0 6.627 5.373 12 12 12s12-5.373 12-12V8L16 3z"
              stroke="url(#shield-grad)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="15" r="2.5" fill="url(#shield-grad)" />
            <path d="M16 17.5v3" stroke="url(#shield-grad)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-base leading-none text-[--text-primary] group-hover:text-hush-violet-300 transition-colors">
            HUSH
          </span>
          <span className="text-[10px] leading-none text-[--text-muted] tracking-wider uppercase mt-0.5">
            Silent Philanthropy
          </span>
        </div>
      </Link>

      {/* Socials */}
      <div className="hidden sm:flex items-center gap-1 mr-2">
        <a 
          href="https://x.com/Ahindra_D" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-[--text-muted] hover:text-hush-violet-300 hover:bg-hush-violet/10 transition-all"
          title="X (formerly Twitter)"
        >
          <XLogo size={16} />
        </a>
      </div>

      {/* Network badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-900/40 bg-amber-950/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-mono text-amber-400/80 font-medium">devnet</span>
      </div>

      <WalletButton />
    </header>
  );
}
