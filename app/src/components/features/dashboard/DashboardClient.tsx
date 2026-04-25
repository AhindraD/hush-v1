'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { BalanceCard } from './BalanceCard';
import { YieldPositions } from './YieldPositions';
import { DepositForm } from './DepositForm';
import { DepositHistory } from './DepositHistory';
import { StatCard } from '@/components/ui/StatCard';
import { useHushAccount } from '@/hooks/useHushAccount';
import { formatUsd, formatApy } from '@/lib/utils';
import { TrendingUp, ShieldCheck, Gift } from 'lucide-react';

interface DashboardClientProps {
  accountId: string;
}

export default function DashboardClient({ accountId }: DashboardClientProps) {
  const { account, deposits, yieldPositions, grants, isLoading } =
    useHushAccount(accountId);

  // Best APY across all positions
  const bestApy = yieldPositions.length
    ? Math.max(...yieldPositions.map((p) => p.apy))
    : 0;

  // Total grants advised
  const totalGranted = grants.reduce((sum, g) => sum + g.amount, 0);

  return (
    <AppLayout accountId={accountId}>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-[--text-primary] mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-[--text-muted]">
          Your private philanthropy overview
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <BalanceCard account={account} isLoading={isLoading} />

        <StatCard
          label="Best APY"
          value={isLoading ? '—' : formatApy(bestApy)}
          subtext="AI-optimized yield"
          color="gold"
          icon={<TrendingUp size={16} />}
          isLoading={isLoading}
        />

        <StatCard
          label="Total Shielded"
          value={isLoading ? '—' : `${deposits.length}`}
          subtext="deposit transactions"
          color="violet"
          icon={<ShieldCheck size={16} />}
          isLoading={isLoading}
        />

        <StatCard
          label="Total Granted"
          value={isLoading ? '—' : formatUsd(totalGranted / 1_000_000)}
          subtext={`${grants.length} grant${grants.length !== 1 ? 's' : ''} advised`}
          color="teal"
          icon={<Gift size={16} />}
          isLoading={isLoading}
        />
      </div>

      {/* Yield positions */}
      <div className="mb-6">
        <YieldPositions
          positions={yieldPositions}
          accountId={accountId}
          isLoading={isLoading}
        />
      </div>

      {/* Deposit form + history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepositForm accountId={accountId} />
        <DepositHistory deposits={deposits} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
