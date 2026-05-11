'use client';

import { History } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TxHash } from '@/components/ui/TxHash';
import { RowSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatUsd, formatAddress, timeAgo } from '@/lib/utils';
import type { Deposit } from '@/lib/api';

interface DepositHistoryProps {
  deposits:  Deposit[];
  isLoading: boolean;
}

export function DepositHistory({ deposits, isLoading }: DepositHistoryProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <History size={15} className="text-[--text-muted]" />
        <h3 className="font-display font-bold text-sm text-[--text-primary]">
          Deposit History
        </h3>
        {deposits.length > 0 && (
          <span className="ml-auto label-text">
            {deposits.length} deposit{deposits.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isLoading ? (
        <RowSkeleton count={4} />
      ) : deposits.length === 0 ? (
        <EmptyDeposits />
      ) : (
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-4 gap-3 px-2 pb-2 border-b border-[--border-subtle]">
            {['Amount', 'Stealth Address', 'Status', 'When'].map((col) => (
              <span key={col} className="label-text">{col}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[--border-subtle]">
            {deposits.map((dep) => (
              <div
                key={dep.id}
                className="grid grid-cols-4 gap-3 px-2 py-3.5 hover:bg-hush-bg-elevated transition-colors duration-100 rounded-lg"
              >
                {/* Amount */}
                <span className="font-mono text-sm font-medium text-[--text-primary]">
                  {formatUsd(dep.amount / 1_000_000)}
                </span>

                {/* Stealth pubkey */}
                <div className="min-w-0">
                  <TxHash
                    hash={dep.stealthPubkey}
                    label=""
                  />
                </div>

                {/* Status */}
                <Badge status={dep.status} size="sm" />

                {/* Time */}
                <span className="text-xs text-[--text-muted] mono self-center">
                  {timeAgo(dep.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyDeposits() {
  return (
    <div className="py-10 text-center">
      <History size={28} className="text-[--text-muted] mx-auto mb-2 opacity-50" />
      <p className="text-sm text-[--text-muted]">No deposits yet.</p>
      <p className="text-xs text-[--text-disabled] mt-1">
        Use the shield form above to make your first private deposit.
      </p>
    </div>
  );
}
