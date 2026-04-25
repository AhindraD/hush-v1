'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { GrantForm } from './GrantForm';
import { GrantHistory } from './GrantHistory';
import { StatCard } from '@/components/ui/StatCard';
import { useHushAccount } from '@/hooks/useHushAccount';
import { formatUsd } from '@/lib/utils';
import { Gift, CheckCircle2, Clock4 } from 'lucide-react';

interface GrantsClientProps {
  accountId: string;
}

export default function GrantsClient({ accountId }: GrantsClientProps) {
  const { grants, account, isLoading } = useHushAccount(accountId);

  const totalGranted   = grants.reduce((s, g) => s + g.amount, 0);
  const settledGrants  = grants.filter((g) => g.status === 'settled');
  const pendingGrants  = grants.filter((g) => g.status === 'pending' || g.status === 'processing');

  return (
    <AppLayout accountId={accountId}>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-[--text-primary] mb-1">
          Grants
        </h1>
        <p className="text-sm text-[--text-muted]">
          Advise anonymous charitable grants from your shielded balance
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Granted"
          value={formatUsd(totalGranted / 1_000_000)}
          subtext={`${grants.length} grant${grants.length !== 1 ? 's' : ''} total`}
          color="teal"
          icon={<Gift size={16} />}
          isLoading={isLoading}
        />
        <StatCard
          label="Settled"
          value={settledGrants.length.toString()}
          subtext="confirmed on-chain"
          color="default"
          icon={<CheckCircle2 size={16} />}
          isLoading={isLoading}
        />
        <StatCard
          label="Pending"
          value={pendingGrants.length.toString()}
          subtext="in private rollup"
          color="violet"
          icon={<Clock4 size={16} />}
          isLoading={isLoading}
        />
      </div>

      {/* Main content: form + history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrantForm accountId={accountId} />
        <GrantHistory grants={grants} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
