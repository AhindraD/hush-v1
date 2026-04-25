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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  accountId: string;
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
    <aside className="flex flex-col w-60 min-h-screen bg-hush-bg-surface border-r border-hush-bg-border">
      {/* Logo area — spacer to match TopBar height */}
      <div className="h-16 border-b border-hush-bg-border flex items-center px-5">
        <span className="font-display font-bold text-lg text-hush-violet-400 tracking-tight">
          HUSH
        </span>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium font-body transition-all duration-150',
                isActive
                  ? 'bg-hush-violet/15 text-hush-violet-300 shadow-sm'
                  : 'text-[--text-secondary] hover:bg-hush-bg-elevated hover:text-[--text-primary]',
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'shrink-0 transition-colors duration-150',
                  isActive ? 'text-hush-violet' : 'text-[--text-muted]',
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-hush-violet" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status indicators */}
      <div className="px-4 py-4 border-t border-hush-bg-border space-y-2.5">
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
