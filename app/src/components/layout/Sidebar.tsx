'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Gift,
  Key,
  Wifi,
  Bot,
  Circle,
  Github,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  accountId: string;
}

// ── Custom X (formerly Twitter) Logo ──────────────────────────────────────────
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

const navItems = (accountId: string) => [
  {
    label: 'Dashboard',
    href:  `/dashboard/${accountId}`,
    icon:  LayoutDashboard,
  },
  {
    label: 'Grants',
    href:  `/grants/${accountId}`,
    icon:  Gift,
  },
  {
    label: 'Viewing Key',
    href:  `/viewing-key/${accountId}`,
    icon:  Key,
  },
];

export function Sidebar({ accountId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-hush-bg-surface border-r border-hush-bg-border sticky top-0">
      {/* Logo area — spacer to match TopBar height */}
      <div className="h-16 border-b border-hush-bg-border flex items-center px-5">
        <Link href="/" className="font-display font-bold text-lg text-hush-violet-400 tracking-tight hover:text-hush-violet-300 transition-colors">
          HUSH
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems(accountId).map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg group',
                'text-sm font-medium font-body transition-all duration-200',
                isActive
                  ? 'bg-hush-violet/15 text-hush-violet-300 shadow-sm'
                  : 'text-[--text-secondary] hover:bg-hush-bg-elevated hover:text-[--text-primary] hover:translate-x-1',
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'shrink-0 transition-colors duration-200 group-hover:scale-110',
                  isActive ? 'text-hush-violet' : 'text-[--text-muted] group-hover:text-hush-violet-300',
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-hush-violet animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom social & status */}
      <div className="px-4 py-4 border-t border-hush-bg-border space-y-4">
        <div className="flex items-center justify-center gap-4 py-1">
          <a 
            href="https://x.com/Ahindra_D" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-hush-bg-elevated text-[--text-muted] hover:text-hush-violet-300 hover:bg-hush-violet/10 transition-all hover:-translate-y-1"
            title="X (formerly Twitter)"
          >
            <XLogo size={16} />
          </a>
          <a 
            href="https://github.com/AhindraD/hush-v1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-hush-bg-elevated text-[--text-muted] hover:text-hush-teal hover:bg-hush-teal/10 transition-all hover:-translate-y-1"
            title="GitHub"
          >
            <Github size={16} />
          </a>
        </div>

        <div className="space-y-2.5">
          {/* PER (Private Ephemeral Rollup) status */}
          <StatusRow
            icon={<Wifi size={13} />}
            label="PER Status"
            value="Active"
            color="teal"
          />

          {/* AI Agent status */}
          <StatusRow
            icon={<Bot size={13} />}
            label="AI Agent"
            value="Running"
            color="violet"
          />

          {/* Solana network */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-hush-bg-elevated">
            <Circle size={8} className="fill-amber-400 text-amber-400 shrink-0" />
            <span className="label-text">Solana Devnet</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface StatusRowProps {
  icon:  React.ReactNode;
  label: string;
  value: string;
  color: 'teal' | 'violet' | 'gold';
}

function StatusRow({ icon, label, value, color }: StatusRowProps) {
  const dotColor = {
    teal:   'bg-hush-teal',
    violet: 'bg-hush-violet',
    gold:   'bg-hush-gold',
  }[color];

  const textColor = {
    teal:   'text-hush-teal',
    violet: 'text-hush-violet-300',
    gold:   'text-hush-gold',
  }[color];

  return (
    <div className="flex items-center justify-between px-2 py-1">
      <div className="flex items-center gap-2 text-[--text-muted]">
        {icon}
        <span className="label-text">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotColor)} />
        <span className={cn('text-xs font-medium font-mono', textColor)}>{value}</span>
      </div>
    </div>
  );
}
