'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn, formatAddress, copyToClipboard } from '@/lib/utils';

interface TxHashProps {
  hash:      string;
  label?:    string;
  network?:  'mainnet' | 'devnet' | 'testnet';
  className?: string;
}

export function TxHash({
  hash,
  label,
  network   = 'devnet',
  className,
}: TxHashProps) {
  const [copied, setCopied] = useState(false);

  const explorerBase =
    network === 'mainnet'
      ? 'https://explorer.solana.com/tx'
      : `https://explorer.solana.com/tx?cluster=${network}`;

  const explorerUrl = `${explorerBase}/${hash}`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(hash);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {label && (
        <span className="label-text mr-0.5">{label}</span>
      )}

      <span
        className="mono text-[--text-secondary] bg-hush-bg-elevated px-2 py-0.5 rounded border border-[--border-subtle]"
        title={hash}
      >
        {formatAddress(hash, 6)}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'p-1 rounded transition-all duration-150',
          'text-[--text-muted] hover:text-[--text-secondary]',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-hush-violet',
          copied && 'text-hush-teal',
        )}
        aria-label="Copy transaction hash"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 rounded text-[--text-muted] hover:text-hush-violet-300 transition-colors duration-150"
        aria-label="View on Solana Explorer"
      >
        <ExternalLink size={13} />
      </a>
    </span>
  );
}
