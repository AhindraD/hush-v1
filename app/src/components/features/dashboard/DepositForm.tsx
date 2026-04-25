'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TxHash } from '@/components/ui/TxHash';
import { useShieldDeposit } from '@/hooks/useShieldDeposit';
import { cn, formatAddress } from '@/lib/utils';

interface DepositFormProps {
  accountId: string;
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export function DepositForm({ accountId }: DepositFormProps) {
  const [amount, setAmount] = useState('');

  const mutation = useShieldDeposit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    mutation.mutate({ accountId, amount: parsed });
  };

  const handleQuickAmount = (n: number) => {
    setAmount(n.toString());
    mutation.reset();
  };

  const isDisabled = mutation.isPending || !amount || parseFloat(amount) <= 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-hush-violet/10">
          <ShieldCheck size={15} className="text-hush-violet-300" />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm text-[--text-primary]">
            Shield Funds
          </h3>
          <p className="text-xs text-[--text-muted] mt-0.5">
            Deposit USDC via stealth address
          </p>
        </div>
      </div>

      {/* Success state */}
      {mutation.isSuccess && mutation.data && (
        <SuccessState
          txHash={mutation.data.txHash}
          stealthPubkey={mutation.data.stealthPubkey}
          amount={amount}
          onReset={() => { mutation.reset(); setAmount(''); }}
        />
      )}

      {/* Form */}
      {!mutation.isSuccess && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="label-text block mb-2" htmlFor="deposit-amount">
              Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--text-muted] font-mono">
                $
              </span>
              <input
                id="deposit-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); mutation.reset(); }}
                placeholder="0.00"
                className={cn(
                  'hush-input w-full pl-7 pr-16 py-2.5 text-sm',
                  'focus:ring-0',
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 label-text">
                USDC
              </span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleQuickAmount(n)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium font-body',
                  'border transition-all duration-150',
                  amount === n.toString()
                    ? 'border-hush-violet/50 bg-hush-violet/15 text-hush-violet-300'
                    : 'border-[--border-default] bg-hush-bg-elevated text-[--text-muted] hover:border-[--border-strong] hover:text-[--text-secondary]',
                )}
              >
                ${n.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={14} className="shrink-0" />
              <span>{mutation.error?.message ?? 'Deposit failed'}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isDisabled}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Shielding…
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                Shield Funds
              </>
            )}
          </button>

          <p className="text-xs text-center text-[--text-disabled]">
            Funds are routed via Umbra stealth addresses. No on-chain link to your wallet.
          </p>
        </form>
      )}
    </div>
  );
}

interface SuccessStateProps {
  txHash:        string;
  stealthPubkey: string;
  amount:        string;
  onReset:       () => void;
}

function SuccessState({ txHash, stealthPubkey, amount, onReset }: SuccessStateProps) {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-hush-teal/10 border border-hush-teal/20">
        <CheckCircle2 size={15} className="text-hush-teal shrink-0" />
        <p className="text-sm text-hush-teal font-medium">
          ${parseFloat(amount).toFixed(2)} USDC shielded successfully
        </p>
      </div>

      <div className="space-y-2.5 p-4 rounded-lg bg-hush-bg-elevated border border-[--border-subtle]">
        <div>
          <p className="label-text mb-1">Transaction</p>
          <TxHash hash={txHash} />
        </div>
        <div>
          <p className="label-text mb-1">Stealth Address</p>
          <span className="mono text-xs text-[--text-secondary]">
            {formatAddress(stealthPubkey, 8)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="btn-ghost w-full py-2.5 text-sm"
      >
        Shield more funds
      </button>
    </div>
  );
}
