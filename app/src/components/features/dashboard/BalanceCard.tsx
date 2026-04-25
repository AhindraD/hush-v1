'use client';

import { useState } from 'react';
import { ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { PrivacyMask } from '@/components/ui/PrivacyMask';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatUsd } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { HushAccount } from '@/lib/api';

interface BalanceCardProps {
  account:   HushAccount | null;
  isLoading: boolean;
}

export function BalanceCard({ account, isLoading }: BalanceCardProps) {
  const [balanceMasked, setBalanceMasked] = useState(true);
  const [yieldMasked,   setYieldMasked]   = useState(false);

  const shieldedBalance = account
    ? account.shieldedBalance / 1_000_000
    : 0;
  const yieldEarned = account
    ? account.yieldEarned / 1_000_000
    : 0;

  return (
    <div className="col-span-2 glass-card p-6 border-l-2 border-l-hush-violet/50 relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 5% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-hush-violet/10">
              <ShieldCheck size={16} className="text-hush-violet-300" />
            </div>
            <div>
              <p className="label-text">Shielded Balance</p>
              <p className="text-xs text-[--text-muted] mt-0.5">
                Protected via Umbra stealth addresses
              </p>
            </div>
          </div>

          {/* PER indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hush-teal/10 border border-hush-teal/20">
            <Zap size={12} className="text-hush-teal" />
            <span className="text-xs font-medium font-mono text-hush-teal">MagicBlock PER</span>
          </div>
        </div>

        {/* Main balance */}
        <div className="mb-6">
          {isLoading ? (
            <LoadingSkeleton className="h-12 w-56" />
          ) : (
            <div className="flex items-baseline gap-3">
              <PrivacyMask
                value={formatUsd(shieldedBalance)}
                masked={balanceMasked}
                onToggle={() => setBalanceMasked((v) => !v)}
                className="font-display font-bold text-4xl md:text-5xl text-[--text-primary]"
                maskLength={8}
              />
              <span className="text-sm font-mono text-[--text-muted] mb-1">USDC</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[--border-subtle]">
          <div>
            <p className="label-text mb-1.5">Yield Earned</p>
            {isLoading ? (
              <LoadingSkeleton className="h-6 w-28" />
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-hush-gold shrink-0" />
                <PrivacyMask
                  value={formatUsd(yieldEarned)}
                  masked={yieldMasked}
                  onToggle={() => setYieldMasked((v) => !v)}
                  className="font-display font-bold text-lg text-hush-gold"
                  maskLength={6}
                />
              </div>
            )}
          </div>

          <div>
            <p className="label-text mb-1.5">Account ID</p>
            {isLoading ? (
              <LoadingSkeleton className="h-6 w-32" />
            ) : (
              <p className="mono text-[--text-muted] truncate">
                {account?.id
                  ? `${account.id.slice(0, 8)}…${account.id.slice(-4)}`
                  : '—'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
