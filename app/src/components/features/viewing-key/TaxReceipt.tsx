'use client';

import { Download, Shield, Receipt, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TxHash } from '@/components/ui/TxHash';
import { formatUsd, timeAgo, formatAddress } from '@/lib/utils';
import type { TaxReceipt as TaxReceiptType } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TaxReceiptProps {
  receipt: TaxReceiptType;
}

export function TaxReceipt({ receipt }: TaxReceiptProps) {
  const handleDownload = () => {
    // Generate a simple JSON download of the receipt
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `hush-tax-receipt-${receipt.taxYear}-${receipt.receiptId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      {/* Receipt header */}
      <div className="p-5 border-b border-[--border-subtle] bg-gradient-to-r from-hush-violet/5 to-hush-teal/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-hush-violet/15">
              <Receipt size={18} className="text-hush-violet-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-[--text-primary]">
                  ZK-Tax-Receipt
                </h3>
                <Badge status="confirmed" size="sm" />
              </div>
              <p className="text-xs text-[--text-muted] mt-0.5">
                Tax Year {receipt.taxYear} · {new Date(receipt.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-body border border-[--border-default] bg-hush-bg-elevated text-[--text-secondary] hover:border-[--border-strong] hover:text-[--text-primary] transition-all duration-150"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ZK Receipt ID */}
        <div className="p-3 rounded-lg bg-hush-bg-elevated border border-[--border-subtle]">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={12} className="text-hush-violet-300" />
            <span className="label-text">ZK Proof CID</span>
          </div>
          <p className="mono text-xs text-[--text-secondary] break-all">{receipt.zkProofCid}</p>
        </div>

        {/* Summary grid */}
        <div>
          <h4 className="label-text mb-3">Tax Year Summary</h4>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCell
              label="Total Deposited"
              value={formatUsd(receipt.totalDeposits / 1_000_000)}
              color="violet"
            />
            <SummaryCell
              label="Total Granted"
              value={formatUsd(receipt.totalGrants / 1_000_000)}
              color="teal"
            />
            <SummaryCell
              label="Yield Earned"
              value={formatUsd(receipt.yieldEarned / 1_000_000)}
              color="gold"
            />
          </div>
        </div>

        {/* Deposits list */}
        {receipt.deposits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="label-text">Deposits ({receipt.deposits.length})</h4>
            </div>
            <div className="space-y-1.5">
              {receipt.deposits.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-hush-bg-elevated border border-[--border-subtle]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm text-[--text-primary] font-medium">
                      {formatUsd(dep.amount / 1_000_000)}
                    </span>
                    <span className="hidden sm:block">
                      <TxHash hash={dep.stealthPubkey} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge status={dep.status} size="sm" />
                    <span className="mono text-[10px] text-[--text-muted]">
                      {timeAgo(dep.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grants list */}
        {receipt.grants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="label-text">Grants ({receipt.grants.length})</h4>
            </div>
            <div className="space-y-1.5">
              {receipt.grants.map((grant) => (
                <div
                  key={grant.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-hush-bg-elevated border border-[--border-subtle]"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[--text-primary] font-medium truncate">
                      {grant.charityName}
                    </p>
                    {grant.memo && (
                      <p className="text-xs text-[--text-muted] italic truncate">
                        "{grant.memo}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-medium text-hush-teal">
                      {formatUsd(grant.amount / 1_000_000)}
                    </span>
                    <Badge status={grant.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 pt-2 border-t border-[--border-subtle]">
          <CheckCircle2 size={12} className="text-hush-teal" />
          <p className="text-xs text-[--text-muted]">
            ZK proof anchored on Solana · Receipt ID: <span className="mono">{receipt.receiptId.slice(0, 12)}…</span>
          </p>
        </div>
      </div>
    </div>
  );
}

interface SummaryCellProps {
  label: string;
  value: string;
  color: 'violet' | 'gold' | 'teal';
}

function SummaryCell({ label, value, color }: SummaryCellProps) {
  const valueColor = {
    violet: 'text-hush-violet-300',
    gold:   'text-hush-gold',
    teal:   'text-hush-teal',
  }[color];

  return (
    <div className="p-3 rounded-lg bg-hush-bg-elevated border border-[--border-subtle] text-center">
      <p className="label-text mb-1.5">{label}</p>
      <p className={cn('font-display font-bold text-sm', valueColor)}>{value}</p>
    </div>
  );
}
