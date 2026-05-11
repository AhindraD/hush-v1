'use client';

import { useState } from 'react';
import { Gift, Loader2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { TxHash } from '@/components/ui/TxHash';
import { useAdviseGrant } from '@/hooks/useAdviseGrant';
import { cn } from '@/lib/utils';

interface GrantFormProps {
  accountId: string;
}

interface CharityPreset {
  name:    string;
  address: string;
  emoji:   string;
  category: string;
}

const CHARITY_PRESETS: CharityPreset[] = [
  {
    name:     'GiveDirectly',
    address:  'GiveDirectly1111111111111111111111111111111',
    emoji:    '🌍',
    category: 'Global Poverty',
  },
  {
    name:     'Against Malaria Foundation',
    address:  'AMF1111111111111111111111111111111111111111',
    emoji:    '🦟',
    category: 'Global Health',
  },
  {
    name:     'Effective Ventures',
    address:  'EV11111111111111111111111111111111111111111',
    emoji:    '🔬',
    category: 'Longtermism',
  },
  {
    name:     'Doctors Without Borders',
    address:  'MSF1111111111111111111111111111111111111111',
    emoji:    '🏥',
    category: 'Humanitarian',
  },
  {
    name:     'Wikimedia Foundation',
    address:  'Wiki111111111111111111111111111111111111111',
    emoji:    '📚',
    category: 'Knowledge',
  },
  {
    name:     'Electronic Frontier Foundation',
    address:  'EFF1111111111111111111111111111111111111111',
    emoji:    '🔒',
    category: 'Digital Rights',
  },
];

const QUICK_AMOUNTS = [50, 100, 500, 1000];

export function GrantForm({ accountId }: GrantFormProps) {
  const [selectedCharity, setSelectedCharity] = useState<CharityPreset | null>(null);
  const [customCharity,   setCustomCharity]   = useState('');
  const [customAddress,   setCustomAddress]   = useState('');
  const [amount,          setAmount]          = useState('');
  const [memo,            setMemo]            = useState('');
  const [useCustom,       setUseCustom]       = useState(false);

  const mutation = useAdviseGrant();

  const effectiveCharity = useCustom
    ? { name: customCharity, address: customAddress }
    : selectedCharity;

  const canSubmit =
    !mutation.isPending &&
    parseFloat(amount) > 0 &&
    effectiveCharity?.name &&
    effectiveCharity?.address;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !effectiveCharity) return;

    mutation.mutate({
      accountId,
      charityName:    effectiveCharity.name,
      charityAddress: effectiveCharity.address,
      amount:         parseFloat(amount),
      memo,
    });
  };

  if (mutation.isSuccess && mutation.data) {
    return (
      <SuccessState
        grantId={mutation.data.id}
        charityName={effectiveCharity?.name ?? ''}
        amount={amount}
        txHash={mutation.data.txHash}
        onReset={() => {
          mutation.reset();
          setAmount('');
          setMemo('');
          setSelectedCharity(null);
        }}
      />
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-hush-teal/10">
          <Gift size={15} className="text-hush-teal" />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm text-[--text-primary]">
            Advise a Grant
          </h3>
          <p className="text-xs text-[--text-muted] mt-0.5">
            Private disbursement via MagicBlock PER
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Charity grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label-text">Select Charity</label>
            <button
              type="button"
              onClick={() => { setUseCustom((v) => !v); setSelectedCharity(null); }}
              className="text-xs text-hush-violet-300 hover:text-hush-violet transition-colors"
            >
              {useCustom ? '← Presets' : '+ Custom'}
            </button>
          </div>

          {useCustom ? (
            <div className="space-y-2">
              <input
                type="text"
                value={customCharity}
                onChange={(e) => setCustomCharity(e.target.value)}
                placeholder="Charity name"
                className="hush-input w-full px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Solana wallet address"
                className="hush-input w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {CHARITY_PRESETS.map((charity) => (
                <button
                  key={charity.address}
                  type="button"
                  onClick={() => setSelectedCharity(charity)}
                  className={cn(
                    'flex items-start gap-2.5 p-3 rounded-lg border text-left',
                    'transition-all duration-150',
                    selectedCharity?.address === charity.address
                      ? 'border-hush-teal/40 bg-hush-teal/10'
                      : 'border-[--border-subtle] bg-hush-bg-elevated hover:border-[--border-default]',
                  )}
                >
                  <span className="text-lg leading-none mt-0.5 shrink-0">{charity.emoji}</span>
                  <div className="min-w-0">
                    <p className={cn(
                      'text-xs font-semibold truncate',
                      selectedCharity?.address === charity.address
                        ? 'text-hush-teal'
                        : 'text-[--text-secondary]',
                    )}>
                      {charity.name}
                    </p>
                    <p className="text-[10px] text-[--text-muted] mt-0.5">{charity.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="label-text block mb-2" htmlFor="grant-amount">
            Amount (USDC)
          </label>
          <div className="relative mb-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--text-muted] font-mono">$</span>
            <input
              id="grant-amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); mutation.reset(); }}
              placeholder="0.00"
              className="hush-input w-full pl-7 pr-16 py-2.5 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 label-text">USDC</span>
          </div>
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(n.toString())}
                className={cn(
                  'flex-1 py-1.5 rounded text-xs font-medium font-body border transition-all duration-150',
                  amount === n.toString()
                    ? 'border-hush-teal/50 bg-hush-teal/15 text-hush-teal'
                    : 'border-[--border-default] bg-hush-bg-elevated text-[--text-muted] hover:border-[--border-strong]',
                )}
              >
                ${n}
              </button>
            ))}
          </div>
        </div>

        {/* Memo */}
        <div>
          <label className="label-text block mb-2" htmlFor="grant-memo">
            Private Memo <span className="text-[--text-disabled] normal-case">(optional)</span>
          </label>
          <textarea
            id="grant-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Q3 giving — anonymous donor"
            rows={2}
            className="hush-input w-full px-3 py-2.5 text-sm resize-none"
            maxLength={200}
          />
          <p className="text-right text-[10px] text-[--text-disabled] mt-1">{memo.length}/200</p>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle size={14} className="shrink-0" />
            <span>{mutation.error?.message ?? 'Grant failed'}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-teal w-full py-2.5 text-sm flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Processing grant…
            </>
          ) : (
            <>
              <Gift size={14} />
              Advise Grant
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

interface SuccessStateProps {
  grantId:     string;
  charityName: string;
  amount:      string;
  txHash:      string;
  onReset:     () => void;
}

function SuccessState({ grantId, charityName, amount, txHash, onReset }: SuccessStateProps) {
  return (
    <div className="glass-card p-5 space-y-4 animate-slide-up">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-hush-teal/10 border border-hush-teal/25">
        <CheckCircle2 size={18} className="text-hush-teal shrink-0" />
        <div>
          <p className="text-sm font-semibold text-hush-teal">
            Grant of ${parseFloat(amount).toFixed(2)} USDC advised
          </p>
          <p className="text-xs text-[--text-muted] mt-0.5">to {charityName}</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-hush-bg-elevated border border-[--border-subtle] space-y-2.5">
        <div>
          <p className="label-text mb-1">Transaction</p>
          <TxHash hash={txHash} />
        </div>
        <div>
          <p className="label-text mb-1">Grant ID</p>
          <span className="mono text-xs text-[--text-muted]">{grantId}</span>
        </div>
      </div>

      <button type="button" onClick={onReset} className="btn-ghost w-full py-2.5 text-sm">
        Advise another grant
      </button>
    </div>
  );
}
