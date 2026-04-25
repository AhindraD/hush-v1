'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Shield } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  accountId?: string;
}

export function TopBar({ accountId }: TopBarProps) {
  return (
    <header className="h-16 border-b border-hush-bg-border bg-hush-bg-surface flex items-center px-6 gap-4">
      {/* Brand */}
      <Link
        href={accountId ? `/dashboard/${accountId}` : '/'}
        className="flex items-center gap-2.5 mr-auto group"
        aria-label="HUSH home"
      >
        {/* SVG shield logo */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 shrink-0"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="shield-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          {/* Shield shape */}
          <path
            d="M16 3L4 8v8c0 6.627 5.373 12 12 12s12-5.373 12-12V8L16 3z"
            stroke="url(#shield-grad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Inner lock keyhole */}
          <circle cx="16" cy="15" r="2.5" fill="url(#shield-grad)" />
          <path
            d="M16 17.5v3"
            stroke="url(#shield-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        <div className="flex flex-col">
          <span className="font-display font-bold text-base leading-none text-[--text-primary] group-hover:text-hush-violet-300 transition-colors">
            HUSH
          </span>
          <span className="text-[10px] leading-none text-[--text-muted] tracking-wider uppercase mt-0.5">
            Silent Philanthropy
          </span>
        </div>
      </Link>

      {/* Network badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-900/40 bg-amber-950/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-mono text-amber-400/80 font-medium">devnet</span>
      </div>

      {/* Wallet connect */}
      <WalletMultiButton />
    </header>
  );
}
