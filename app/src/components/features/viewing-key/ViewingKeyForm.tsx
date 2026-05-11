'use client';

import { useState } from 'react';
import { Key, Loader2, AlertCircle, Eye, Zap, Database, Shield } from 'lucide-react';
import { useViewingKey } from '@/hooks/useViewingKey';
import { cn } from '@/lib/utils';
import type { TaxReceipt } from '@/lib/api';

interface ViewingKeyFormProps {
  accountId:       string;
  onReceiptGenerated: (receipt: TaxReceipt) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const TAX_YEARS    = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

// Demo viewing key (would come from wallet signing in production)
const DEMO_VIEWING_KEY =
  'vk_hush_1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890';

const DECRYPT_STEPS = [
  { icon: Key,      label: 'Verifying viewing key',       color: 'text-hush-gold-bright' },
  { icon: Database, label: 'Fetching encrypted records',  color: 'text-hush-gold'       },
  { icon: Shield,   label: 'Generating ZK proof',         color: 'text-solana-green'     },
];

export function ViewingKeyForm({
  accountId,
  onReceiptGenerated,
}: ViewingKeyFormProps) {
  const [viewingKey, setViewingKey] = useState('');
  const [taxYear,    setTaxYear]    = useState(CURRENT_YEAR);

  const mutation = useViewingKey();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingKey.trim()) return;

    mutation.mutate(
      { accountId, viewingKey, taxYear },
      {
        onSuccess: (data) => {
          onReceiptGenerated(data.receipt);
        },
      },
    );
  };

  const handleDemo = () => {
    setViewingKey(DEMO_VIEWING_KEY);
    mutation.reset();
  };

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-hush-gold-dim">
          <Key size={15} className="text-hush-gold" />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm text-[--text-primary]">
            Viewing Key Audit
          </h3>
          <p className="text-xs text-[--text-muted] mt-0.5">
            Generate a ZK-Tax-Receipt for compliance
          </p>
        </div>
      </div>

      {/* Loading: decryption pipeline animation */}
      {mutation.isPending && (
        <DecryptionPipeline />
      )}

      {/* Form */}
      {!mutation.isPending && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Viewing key input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-text" htmlFor="viewing-key">
                Viewing Key
              </label>
              <button
                type="button"
                onClick={handleDemo}
                className="flex items-center gap-1.5 text-xs text-hush-gold-bright hover:text-hush-gold transition-colors"
              >
                <Eye size={12} />
                Autofill demo
              </button>
            </div>
            <div className="relative">
              <input
                id="viewing-key"
                type="text"
                value={viewingKey}
                onChange={(e) => { setViewingKey(e.target.value); mutation.reset(); }}
                placeholder="vk_hush_1a2b3c…"
                className="hush-input w-full px-3 py-2.5 text-sm font-mono pr-10"
                spellCheck={false}
              />
              {viewingKey && (
                <button
                  type="button"
                  onClick={() => setViewingKey('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-muted] hover:text-[--text-secondary] text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-xs text-[--text-disabled] mt-1.5">
              Your viewing key never leaves your browser.
            </p>
          </div>

          {/* Tax year selector */}
          <div>
            <label className="label-text block mb-2">Tax Year</label>
            <div className="flex gap-2">
              {TAX_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setTaxYear(year)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium font-body border',
                    'transition-all duration-150',
                    taxYear === year
                      ? 'border-hush-gold/50 bg-hush-gold-dim text-hush-gold'
                      : 'border-[--border-default] bg-hush-bg-elevated text-[--text-muted] hover:border-[--border-strong]',
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={14} className="shrink-0" />
              <span>{mutation.error?.message ?? 'Verification failed'}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!viewingKey.trim() || mutation.isPending}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Zap size={14} />
            Generate ZK-Tax-Receipt
          </button>

          <p className="text-xs text-center text-[--text-disabled]">
            Audit log will be recorded (anonymized) per IRS §6001 compliance.
          </p>
        </form>
      )}
    </div>
  );
}

/**
 * Animated 3-step decryption pipeline displayed while loading.
 */
function DecryptionPipeline() {
  return (
    <div className="py-4 space-y-3 animate-fade-in" role="status" aria-label="Generating ZK receipt">
      <p className="text-sm text-center text-[--text-muted] mb-4 font-medium">
        Decrypting records…
      </p>

      {DECRYPT_STEPS.map((step, i) => (
        <DecryptStep
          key={step.label}
          icon={step.icon}
          label={step.label}
          color={step.color}
          delay={i * 200}
        />
      ))}

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-hush-bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-hush-gold-deep to-hush-gold rounded-full animate-[shimmer_1.6s_linear_infinite]"
          style={{
            backgroundSize: '200% 100%',
            width: '60%',
          }}
        />
      </div>
    </div>
  );
}

interface DecryptStepProps {
  icon:  React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color: string;
  delay: number;
}

function DecryptStep({ icon: Icon, label, color, delay }: DecryptStepProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border border-[--border-subtle] bg-hush-bg-elevated animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn('shrink-0', color)}>
        <Icon size={14} className="animate-pulse" />
      </div>
      <span className="text-sm text-[--text-secondary] font-body flex-1">{label}</span>
      <Loader2 size={12} className="text-[--text-muted] animate-spin shrink-0" />
    </div>
  );
}
