import { cn } from '@/lib/utils';

type BadgeStatus =
  | 'settled'
  | 'pending'
  | 'processing'
  | 'failed'
  | 'shielded'
  | 'confirmed'
  | 'active';

interface BadgeProps {
  status:   BadgeStatus;
  size?:    'sm' | 'md';
  className?: string;
}

const statusConfig: Record<
  BadgeStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  settled: {
    label: 'Settled',
    dot:   'bg-hush-teal',
    bg:    'bg-hush-teal/10',
    text:  'text-hush-teal',
  },
  pending: {
    label: 'Pending',
    dot:   'bg-amber-400',
    bg:    'bg-amber-400/10',
    text:  'text-amber-400',
  },
  processing: {
    label: 'Processing',
    dot:   'bg-blue-400 animate-pulse',
    bg:    'bg-blue-400/10',
    text:  'text-blue-400',
  },
  failed: {
    label: 'Failed',
    dot:   'bg-red-500',
    bg:    'bg-red-500/10',
    text:  'text-red-400',
  },
  shielded: {
    label: 'Shielded',
    dot:   'bg-hush-violet animate-pulse',
    bg:    'bg-hush-violet/10',
    text:  'text-hush-violet-300',
  },
  confirmed: {
    label: 'Confirmed',
    dot:   'bg-emerald-400',
    bg:    'bg-emerald-400/10',
    text:  'text-emerald-400',
  },
  active: {
    label: 'Active',
    dot:   'bg-hush-teal animate-pulse',
    bg:    'bg-hush-teal/10',
    text:  'text-hush-teal',
  },
};

export function Badge({ status, size = 'md', className }: BadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium font-body',
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : 'px-2.5 py-1 text-xs',
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}
