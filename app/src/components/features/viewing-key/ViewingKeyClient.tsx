'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ViewingKeyForm } from './ViewingKeyForm';
import { TaxReceipt } from './TaxReceipt';
import type { TaxReceipt as TaxReceiptType } from '@/lib/api';
import { Key, ShieldCheck, FileText, AlertCircle } from 'lucide-react';

interface ViewingKeyClientProps {
  accountId: string;
}

export default function ViewingKeyClient({ accountId }: ViewingKeyClientProps) {
  const [receipt, setReceipt] = useState<TaxReceiptType | null>(null);

  return (
    <AppLayout accountId={accountId}>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-[--text-primary] mb-1">
          Viewing Key &amp; Audit
        </h1>
        <p className="text-sm text-[--text-muted]">
          Generate ZK-Tax-Receipts for IRS compliance without revealing donor identity
        </p>
      </div>

      {/* Explainer row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ExplainerCard
          icon={Key}
          title="Private Verification"
          body="Your viewing key cryptographically proves donation history without revealing your wallet address."
          color="violet"
        />
        <ExplainerCard
          icon={ShieldCheck}
          title="ZK Proof"
          body="A zero-knowledge proof is generated and anchored on-chain, verifiable by any auditor."
          color="teal"
        />
        <ExplainerCard
          icon={FileText}
          title="IRS Compliant"
          body="Receipts satisfy IRC §170 charitable deduction documentation requirements."
          color="gold"
        />
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 p-3.5 rounded-lg bg-hush-violet/8 border border-hush-violet/20 mb-6">
        <AlertCircle size={14} className="text-hush-violet-300 mt-0.5 shrink-0" />
        <p className="text-xs text-[--text-secondary]">
          Your viewing key is processed entirely in-browser and never transmitted to HUSH servers.
          An anonymized audit log entry is created to satisfy compliance requirements.
        </p>
      </div>

      {/* Two-column: form + receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViewingKeyForm
          accountId={accountId}
          onReceiptGenerated={setReceipt}
        />

        {receipt ? (
          <TaxReceipt receipt={receipt} />
        ) : (
          <EmptyReceiptSlot />
        )}
      </div>
    </AppLayout>
  );
}

interface ExplainerCardProps {
  icon:  React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body:  string;
  color: 'violet' | 'teal' | 'gold';
}

function ExplainerCard({ icon: Icon, title, body, color }: ExplainerCardProps) {
  const colors = {
    violet: { icon: 'bg-hush-violet/10 text-hush-violet-300', border: 'border-l-hush-violet/30' },
    teal:   { icon: 'bg-hush-teal/10 text-hush-teal',         border: 'border-l-hush-teal/30'   },
    gold:   { icon: 'bg-hush-gold/10 text-hush-gold',         border: 'border-l-hush-gold/30'   },
  }[color];

  return (
    <div className={`glass-card p-4 border-l-2 ${colors.border}`}>
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colors.icon}`}>
        <Icon size={14} />
      </div>
      <h4 className="font-display font-bold text-sm text-[--text-primary] mb-1.5">
        {title}
      </h4>
      <p className="text-xs text-[--text-muted] leading-relaxed">{body}</p>
    </div>
  );
}

function EmptyReceiptSlot() {
  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
      <div className="w-12 h-12 rounded-xl bg-hush-bg-elevated border border-[--border-subtle] flex items-center justify-center mb-4">
        <FileText size={20} className="text-[--text-muted]" />
      </div>
      <p className="text-sm text-[--text-muted] font-medium">No receipt generated yet</p>
      <p className="text-xs text-[--text-disabled] mt-1.5 max-w-[220px]">
        Enter your viewing key and select a tax year to generate your ZK-Tax-Receipt.
      </p>
    </div>
  );
}
