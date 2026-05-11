'use client';

import { useState } from 'react';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RowSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatUsd, formatApy, cn } from '@/lib/utils';
import { rebalanceYield, type YieldPosition } from '@/lib/api';

interface YieldPositionsProps {
  positions:  YieldPosition[];
  accountId:  string;
  isLoading:  boolean;
}

export function YieldPositions({
  positions,
  accountId,
  isLoading,
}: YieldPositionsProps) {
  const queryClient = useQueryClient();

  const rebalanceMutation = useMutation({
    mutationFn: () => rebalanceYield(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hush-account', accountId] });
    },
  });

  const totalAllocated = positions.reduce((sum, p) => sum + p.allocated, 0);

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-hush-gold" />
          <h3 className="font-display font-bold text-sm text-[--text-primary]">
            AI Yield Positions
          </h3>
        </div>

        <button
          type="button"
          onClick={() => rebalanceMutation.mutate()}
          disabled={rebalanceMutation.isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-body',
            'border border-hush-gold/30 text-hush-gold bg-hush-gold/5',
            'hover:bg-hush-gold/10 transition-colors duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <RefreshCw
            size={12}
            className={rebalanceMutation.isPending ? 'animate-spin' : ''}
          />
          {rebalanceMutation.isPending ? 'Rebalancing…' : 'Rebalance'}
        </button>
      </div>

      {/* Error state */}
      {rebalanceMutation.isError && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={14} />
          <span>Rebalance failed: {rebalanceMutation.error?.message}</span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <RowSkeleton count={3} />
      ) : positions.length === 0 ? (
        <EmptyYield />
      ) : (
        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-3 px-2 pb-2 border-b border-[--border-subtle]">
            {['Protocol', 'APY', 'Allocated', 'Accrued'].map((col) => (
              <span key={col} className="label-text">{col}</span>
            ))}
          </div>

          {/* Data rows */}
          {positions.map((pos) => {
            const allocationPct =
              totalAllocated > 0
                ? (pos.allocated / totalAllocated) * 100
                : 0;

            return (
              <div
                key={pos.id}
                className="grid grid-cols-4 gap-3 px-2 py-3 rounded-lg hover:bg-hush-bg-elevated transition-colors duration-100"
              >
                {/* Protocol */}
                <div className="flex items-center gap-2 min-w-0">
                  <ProtocolDot protocol={pos.protocol} />
                  <span className="text-sm text-[--text-primary] font-medium truncate">
                    {pos.protocol}
                  </span>
                </div>

                {/* APY */}
                <span className="text-sm font-mono font-medium text-hush-gold">
                  {formatApy(pos.apy)}
                </span>

                {/* Allocated with bar */}
                <div className="space-y-1">
                  <span className="text-sm text-[--text-secondary] mono">
                    {formatUsd(pos.allocated / 1_000_000)}
                  </span>
                  <div className="h-1 bg-hush-bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-hush-violet to-hush-teal rounded-full transition-all duration-500"
                      style={{ width: `${allocationPct}%` }}
                    />
                  </div>
                </div>

                {/* Accrued yield */}
                <span className="text-sm font-mono text-hush-teal">
                  +{formatUsd(pos.accrued / 1_000_000)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProtocolDot({ protocol }: { protocol: string }) {
  const colors: Record<string, string> = {
    'Kamino':    'bg-blue-400',
    'Marginfi':  'bg-purple-400',
    'Solend':    'bg-teal-400',
    'Drift':     'bg-orange-400',
    'Mango':     'bg-yellow-400',
  };
  const color = colors[protocol] ?? 'bg-hush-violet';
  return <span className={cn('w-2 h-2 rounded-full shrink-0', color)} />;
}

function EmptyYield() {
  return (
    <div className="py-8 text-center">
      <TrendingUp size={28} className="text-[--text-muted] mx-auto mb-2" />
      <p className="text-sm text-[--text-muted]">No yield positions yet.</p>
      <p className="text-xs text-[--text-disabled] mt-1">
        Shield funds to activate the AI yield agent.
      </p>
    </div>
  );
}
