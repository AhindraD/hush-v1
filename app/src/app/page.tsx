import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Bot,
  Key,
  TrendingUp,
  Lock,
  Globe,
  ArrowRight,
  ChevronRight,
  Github,
  FileText,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

// ── Demo account for CTA links ────────────────────────────────────────────
const DEMO_ACCOUNT_ID = 'demo_hush_account_01';

// ── Custom X Logo ─────────────────────────────────────────────────────────
function XLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      aria-hidden="true"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Landing Page (server component — no data fetching)
// ────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[--bg-base]">
      <TopBar />

      <main className="relative">
        {/* ── Hero ─────────────────────────────────────────── */}
        <HeroSection />

        {/* ── Stats bar ────────────────────────────────────── */}
        <StatsBar />

        {/* ── Features grid ────────────────────────────────── */}
        <FeaturesSection />

        {/* ── Privacy stack ────────────────────────────────── */}
        <PrivacyStackSection />

        {/* ── How it works ─────────────────────────────────── */}
        <HowItWorksSection />

        {/* ── CTA ──────────────────────────────────────────── */}
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Hero Section
// ────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 px-6">
      {/* Grid background */}
      <div
        className="absolute inset-0 grid-bg opacity-100"
        aria-hidden="true"
      />

      {/* Ambient blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse, rgba(153,69,255,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse, rgba(20,241,149,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hush-gold/30 bg-hush-gold-dim mb-8 animate-in fade-in slide-in-from-top-4 duration-1000 fill-mode-both">
          <span className="w-1.5 h-1.5 rounded-full bg-hush-gold animate-pulse" />
          <span className="text-xs font-medium font-body text-hush-gold">
            Built on Solana · Umbra · MagicBlock
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 fill-mode-both">
          Give generously.{' '}
          <span className="gradient-text-gold block md:inline">Stay private.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-[--text-secondary] max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-both">
          HUSH is a confidential philanthropy engine. Stealth deposits, AI-optimized
          yield, and ZK-Tax-Receipts — all on Solana. No one knows you gave.
          The IRS still can.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/dashboard/${DEMO_ACCOUNT_ID}`}
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both"
          >
            <ShieldCheck size={16} />
            Launch App
            <ArrowRight size={14} />
          </Link>
          <a
            href="https://github.com/AhindraD/hush-v1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400 fill-mode-both"
          >
            <FileText size={14} />
            Read Docs
          </a>
        </div>

        {/* Trust note */}
        <p className="mt-6 text-xs text-[--text-muted] animate-in fade-in duration-1000 delay-500 fill-mode-both">
          Non-custodial · Open source · Built by <a href="https://x.com/Ahindra_D" className="text-hush-gold hover:underline" target="_blank" rel="noopener noreferrer">@Ahindra_D</a>
        </p>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Stats Bar
// ────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Shielded',   value: '$4.2M',  color: 'text-hush-gold' },
  { label: 'Grants Advised',   value: '1,847',  color: 'text-solana-green'    },
  { label: 'Avg. APY',         value: '9.4%',   color: 'text-hush-gold'       },
  { label: 'Unique Donors',    value: '312',    color: 'text-[--text-primary]' },
];

function StatsBar() {
  return (
    <section className="border-y border-[--border-subtle] bg-hush-bg-surface py-8 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className={`font-display font-bold text-3xl mb-1 ${stat.color}`}>
              {stat.value}
            </p>
            <p className="label-text">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Features Section
// ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon:        ShieldCheck,
    title:       'Stealth Deposits',
    description:
      'Powered by Umbra SDK, every deposit is routed to a one-time stealth address. Your wallet is never linked to the donation on-chain.',
    tag:         'Umbra Protocol',
    color:       'violet',
  },
  {
    icon:        Zap,
    title:       'Private Ephemeral Rollups',
    description:
      'Grant disbursements execute inside MagicBlock\'s ephemeral rollup. Sub-second finality with full Solana security. Zero MEV exposure.',
    tag:         'MagicBlock PER',
    color:       'teal',
  },
  {
    icon:        Bot,
    title:       'AI Yield Agent',
    description:
      'Your shielded balance earns while it waits. An on-chain AI agent continuously rebalances across Kamino, Marginfi, and Solend for optimal APY.',
    tag:         'AI-Powered',
    color:       'gold',
  },
  {
    icon:        Key,
    title:       'ZK-Tax-Receipts',
    description:
      'Prove charitable deductions to the IRS without revealing your identity. A ZK proof anchored on-chain satisfies §170 documentation requirements.',
    tag:         'IRS Compliant',
    color:       'violet',
  },
  {
    icon:        Lock,
    title:       'Viewing Key Privacy',
    description:
      'You control disclosure. Share a viewing key with your accountant for audit access — while keeping the rest of your on-chain history completely private.',
    tag:         'Selective Disclosure',
    color:       'teal',
  },
  {
    icon:        TrendingUp,
    title:       'Yield on Impact',
    description:
      'USDC deposited to HUSH generates yield before it\'s granted. Every dollar gives more than a dollar. Yield accrues to your next grant automatically.',
    tag:         'More Impact',
    color:       'gold',
  },
] as const;

function FeaturesSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="label-text mb-3">How HUSH Works</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-[--text-primary]">
            Four layers of privacy,{' '}
            <span className="gradient-text-gold">one seamless experience</span>
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <FeatureCard key={feat.title} {...feat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon:        React.ComponentType<{ size?: number; className?: string }>;
  title:       string;
  description: string;
  tag:         string;
  color:       'violet' | 'teal' | 'gold';
  index:       number;
}

function FeatureCard({ icon: Icon, title, description, tag, color, index }: FeatureCardProps) {
  const colorMap = {
    violet: { icon: 'bg-hush-gold/10 text-hush-gold', tag: 'bg-hush-gold/10 text-hush-gold', border: 'hover:border-hush-gold/30' },
    teal:   { icon: 'bg-solana-green/10 text-solana-green',   tag: 'bg-solana-green/10 text-solana-green',   border: 'hover:border-solana-green/30' },
    gold:   { icon: 'bg-hush-gold/10 text-hush-gold',         tag: 'bg-hush-gold/10 text-hush-gold',         border: 'hover:border-hush-gold/30'   },
  }[color];

  return (
    <div 
      className={`glass-card p-5 flex flex-col gap-4 transition-all duration-300 ${colorMap.border} hover:scale-[1.03] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl ${colorMap.icon}`}>
          <Icon size={17} />
        </div>
        <span className={`text-[10px] font-medium font-body px-2 py-1 rounded-full ${colorMap.tag}`}>
          {tag}
        </span>
      </div>
      <div>
        <h3 className="font-display font-bold text-sm text-[--text-primary] mb-2">
          {title}
        </h3>
        <p className="text-xs text-[--text-muted] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Privacy Stack Diagram
// ────────────────────────────────────────────────────────────
const STACK_LAYERS = [
  {
    layer: 'L1',
    name:  'Solana Mainnet',
    desc:  'Settlement layer · ZK proof anchoring · Final irreversibility',
    color: 'border-l-solana-green/60 text-solana-green',
  },
  {
    layer: 'L1.5',
    name:  'MagicBlock Ephemeral Rollup',
    desc:  'Private grant execution · <100ms finality · No mempool visibility',
    color: 'border-l-hush-gold/60 text-hush-gold',
  },
  {
    layer: 'SDK',
    name:  'Umbra Stealth Layer',
    desc:  'One-time stealth addresses · Ephemeral ECDH keys · No address reuse',
    color: 'border-l-hush-gold/60 text-hush-gold',
  },
  {
    layer: 'APP',
    name:  'HUSH Interface',
    desc:  'Local key management · ZK receipt generation · AI yield routing',
    color: 'border-l-[--border-strong] text-[--text-secondary]',
  },
];

function PrivacyStackSection() {
  return (
    <section className="py-24 px-6 bg-hush-bg-surface border-y border-[--border-subtle]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="label-text mb-3">Architecture</p>
          <h2 className="font-display font-bold text-3xl text-[--text-primary]">
            Privacy stack diagram
          </h2>
          <p className="text-sm text-[--text-muted] mt-3">
            Four integrated layers ensure no single point can correlate donor identity to donation.
          </p>
        </div>

        <div className="space-y-3">
          {STACK_LAYERS.map((layer, i) => (
            <div
              key={layer.name}
              className={`p-4 rounded-xl border border-[--border-subtle] bg-hush-bg-elevated border-l-2 ${layer.color} transition-transform duration-200 hover:translate-x-1`}
              style={{ opacity: 1 - i * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <span className={`mono text-xs font-semibold w-10 shrink-0 ${layer.color.split(' ').pop()}`}>
                  {layer.layer}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[--text-primary]">{layer.name}</p>
                  <p className="text-xs text-[--text-muted] mt-0.5">{layer.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// How It Works
// ────────────────────────────────────────────────────────────
const STEPS = [
  {
    step:  '01',
    title: 'Connect &amp; Deposit',
    desc:  'Connect your Phantom or Solflare wallet. USDC is routed to a stealth address — no on-chain link to your identity.',
    color: 'text-hush-gold',
  },
  {
    step:  '02',
    title: 'Earn Yield',
    desc:  'Your shielded balance is deployed to the highest-APY DeFi protocols by the on-chain AI agent. Watch it grow.',
    color: 'text-hush-gold',
  },
  {
    step:  '03',
    title: 'Advise a Grant',
    desc:  'Select a charity from the curated list or enter any wallet address. The grant executes privately inside MagicBlock PER.',
    color: 'text-solana-green',
  },
  {
    step:  '04',
    title: 'Generate Receipt',
    desc:  'Use your viewing key to generate a ZK-Tax-Receipt. Share with your accountant. Keep everything else private.',
    color: 'text-[--text-secondary]',
  },
];

function HowItWorksSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="label-text mb-3">Process</p>
          <h2 className="font-display font-bold text-3xl text-[--text-primary]">
            Four steps to silent philanthropy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {STEPS.map((step) => (
            <div key={step.step} className="glass-card p-5 flex gap-4 transition-transform hover:scale-[1.01]">
              <span className={`font-display font-bold text-3xl leading-none shrink-0 mt-0.5 ${step.color}`}>
                {step.step}
              </span>
              <div>
                <h3
                  className="font-display font-bold text-sm text-[--text-primary] mb-1.5"
                  dangerouslySetInnerHTML={{ __html: step.title }}
                />
                <p className="text-xs text-[--text-muted] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// CTA Section
// ────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div
          className="relative rounded-2xl p-10 overflow-hidden border border-hush-gold/20"
          style={{
            background: 'linear-gradient(135deg, rgba(153,69,255,0.1) 0%, rgba(20,241,149,0.06) 100%)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(153,69,255,0.08) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-hush-gold/15 border border-hush-gold/30 flex items-center justify-center mx-auto mb-6 animate-float">
              <ShieldCheck size={24} className="text-hush-gold" />
            </div>

            <h2 className="font-display font-bold text-3xl text-[--text-primary] mb-4">
              Ready to give silently?
            </h2>
            <p className="text-sm text-[--text-secondary] mb-8 leading-relaxed">
              HUSH is live on Solana devnet. Connect your wallet and make your
              first shielded donation in under 60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/dashboard/${DEMO_ACCOUNT_ID}`}
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 fill-mode-both"
              >
                <ShieldCheck size={15} />
                Open Dashboard
                <ArrowRight size={14} />
              </Link>
              <a
                href="https://github.com/AhindraD/hush-v1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700 fill-mode-both"
              >
                <Github size={14} />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="border-t border-[--border-subtle] bg-hush-bg-surface py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Shield mini logo */}
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
            <path d="M8 1.5L2 4v4c0 3.314 2.686 6 6 6s6-2.686 6-6V4L8 1.5z" stroke="#CBB067" strokeWidth="1.2" />
          </svg>
          <span className="text-sm font-display font-bold text-[--text-primary]">HUSH</span>
          <span className="text-xs text-[--text-muted]">· by <a href="https://x.com/Ahindra_D" className="hover:text-hush-gold transition-colors" target="_blank" rel="noopener noreferrer">@Ahindra_D</a></span>
        </div>

        <div className="flex items-center gap-5">
          <a href="https://github.com/AhindraD/hush-v1" className="text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://x.com/Ahindra_D" className="text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors flex items-center gap-1" target="_blank" rel="noopener noreferrer">
            <XLogo size={12} />
            X
          </a>
          <a href="/privacy" className="text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors">Privacy</a>
          <a href="/terms" className="text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors">Terms</a>
        </div>

        <p className="text-xs text-[--text-disabled]">
          © {new Date().getFullYear()} HUSH Protocol
        </p>
      </div>
    </footer>
  );
}
