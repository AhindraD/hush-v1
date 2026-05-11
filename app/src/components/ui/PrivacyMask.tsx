'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrivacyMaskProps {
  value:     string;
  masked?:   boolean;
  onToggle?: () => void;
  className?: string;
  maskChar?:  string;
  maskLength?: number;
}

const MASK = '●●●●●●';

export function PrivacyMask({
  value,
  masked:       maskedProp,
  onToggle:     onToggleProp,
  className,
  maskChar     = '●',
  maskLength   = 6,
}: PrivacyMaskProps) {
  // If controlled externally, use the prop; otherwise manage state internally
  const [internalMasked, setInternalMasked] = useState(true);
  const isControlled = maskedProp !== undefined;
  const masked       = isControlled ? maskedProp : internalMasked;

  const handleToggle = () => {
    if (isControlled && onToggleProp) {
      onToggleProp();
    } else {
      setInternalMasked((prev) => !prev);
    }
  };

  const maskedValue = maskChar.repeat(maskLength);

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'font-mono text-[--text-primary] transition-all duration-200',
          masked && 'tracking-widest text-[--text-muted] select-none',
        )}
        aria-label={masked ? 'Hidden value' : value}
      >
        {masked ? maskedValue : value}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'p-1 rounded transition-colors duration-150',
          'text-[--text-muted] hover:text-[--text-secondary]',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-hush-gold',
        )}
        aria-label={masked ? 'Reveal value' : 'Hide value'}
      >
        {masked ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </span>
  );
}
