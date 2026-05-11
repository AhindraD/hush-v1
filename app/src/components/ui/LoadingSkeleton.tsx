import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  width?:     string | number;
  height?:    string | number;
  rounded?:   'sm' | 'md' | 'lg' | 'full';
}

export function LoadingSkeleton({
  className,
  width,
  height,
  rounded = 'md',
}: LoadingSkeletonProps) {
  const roundedClass = {
    sm:   'rounded',
    md:   'rounded-md',
    lg:   'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <span
      className={cn('block skeleton', roundedClass, className)}
      style={{
        width:  typeof width  === 'number' ? `${width}px`  : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * A preset card skeleton for loading states.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-5 space-y-3', className)}>
      <LoadingSkeleton className="h-3 w-1/3" />
      <LoadingSkeleton className="h-7 w-2/3" />
      <LoadingSkeleton className="h-3 w-1/2" />
    </div>
  );
}

/**
 * A preset row skeleton for table-like loading states.
 */
export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 px-1">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 flex-1" />
          <LoadingSkeleton className="h-5 w-16" rounded="full" />
          <LoadingSkeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
