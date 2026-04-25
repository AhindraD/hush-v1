'use client';

import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TxHash } from '@/components/ui/TxHash';
import { RowSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatUsd, timeAgo } from '@/lib/utils';
import type { Grant } from '@/lib/api';

interface GrantHistoryProps {
  grants:    Grant[];
  isLoading: boolean;
}

export function GrantHistory({ grants, isLoading }: GrantHistoryProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <Clock size={15} className="text-[--text-muted]" />
        <h3 className="font-display font-bold text-sm text-[--text-primary]">
          Grant History
        </h3>
        {grants.length > 0 && (
          <span className="ml-auto label-text">
            {grants.length} grant{grants.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isLoading ? (
        <RowSkeleton count={4} />
      ) : grants.length === 0 ? (
        <EmptyGrants />
      ) : (
        <div className="space-y-0">
          {grants.map((grant, i) => (
            <div
              key={grant.id}
              className="py-4 flex items-start gap-4 border-b border-[--border-subtle] last:border-0"
            >
              {/* Left: charity initial circle */}
              <div className="w-9 h-9 rounded-full bg-hush-teal/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-display font-bold text-hush-teal">
                  {grant.charityName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Center: name + memo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-[--text-primary] truncate">
                    {grant.charityName}
                  </p>
                  <Badge status={grant.status} size="sm" />
                </div>

                {grant.memo && (
                  <p className="text-xs text-[--text-muted] mt-0.5 truncate italic">
                    "{grant.memo}"
                  </p>
                )}

                <div className="mt-1.5">
                  <TxHash hash={grant.txHash} />
                </div>
              </div>

              {/* Right: amount + time */}
              <div className="shrink-0 text-right">
                <p className="font-display font-bold text-sm text-hush-teal">
                  {formatUsd(grant.amount / 1_000_000)}
                </p>
                <p className="text-[10px] mono text-[--text-muted] mt-0.5">
                  {timeAgo(grant.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyGrants() {
  return (
    <div className="py-10 text-center">
      <Clock size={28} className="text-[--text-muted] mx-auto mb-2 opacity-50" />
      <p className="text-sm text-[--text-muted]">No grants advised yet.</p>
      <p className="text-xs text-[--text-disabled] mt-1">
        Use the form above to make your first private grant.
      </p>
    </div>
  );
}
