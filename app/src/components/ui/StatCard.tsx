import { cn } from '@/lib/utils';
import { LoadingSkeleton } from './LoadingSkeleton';

interface StatCardProps {
  label:     string;
  value:     string | number;
  subtext?:  string;
  color?:    'purple' | 'gold' | 'green' | 'default' | 'violet' | 'teal';
  icon?:     React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const colorMap: Record<string, { icon: string; value: string; accent: string }> = {
  purple: {
    icon:    'bg-solana-purple/10 text-solana-purple',
    value:   'text-solana-purple',
    accent:  'border-l-solana-purple/40',
  },
  violet: {
    icon:    'bg-solana-purple/10 text-solana-purple',
    value:   'text-solana-purple',
    accent:  'border-l-solana-purple/40',
  },
  gold: {
    icon:    'bg-hush-gold/10 text-hush-gold',
    value:   'text-hush-gold',
    accent:  'border-l-hush-gold/40',
  },
  green: {
    icon:    'bg-solana-green/10 text-solana-green',
    value:   'text-solana-green',
    accent:  'border-l-solana-green/40',
  },
  teal: {
    icon:    'bg-solana-green/10 text-solana-green',
    value:   'text-solana-green',
    accent:  'border-l-solana-green/40',
  },
  default: {
    icon:    'bg-hush-bg-muted text-[--text-secondary]',
    value:   'text-[--text-primary]',
    accent:  'border-l-[--border-default]',
  },
};

export function StatCard({
  label,
  value,
  subtext,
  color = 'default',
  icon,
  isLoading = false,
  className,
}: StatCardProps) {
  const colors = colorMap[color] || colorMap.default;

  return (
    <div
      className={cn(
        'glass-card p-5 border-l-2 transition-all duration-500 hover:scale-[1.02] hover:shadow-glow-gold/10',
        colors.accent,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="label-text mb-2">{label}</p>

          {isLoading ? (
            <LoadingSkeleton className="h-7 w-3/4 mb-1.5" />
          ) : (
            <p
              className={cn(
                'font-display font-bold text-2xl leading-none tracking-tight',
                colors.value,
              )}
            >
              {value}
            </p>
          )}

          {subtext && !isLoading && (
            <p className="text-xs text-[--text-muted] mt-1.5 font-body">
              {subtext}
            </p>
          )}
          {isLoading && <LoadingSkeleton className="h-3 w-1/2 mt-1.5" />}
        </div>

        {icon && (
          <div className={cn('p-2.5 rounded-lg shrink-0', colors.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
