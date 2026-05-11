import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names intelligently.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD with compact notation above 1M.
 * e.g. 1234567 → "$1.23M"
 */
export function formatUsd(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';

  if (Math.abs(n) >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      style:             'currency',
      currency:          'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(n / 1_000_000) + 'M';
  }

  return new Intl.NumberFormat('en-US', {
    style:             'currency',
    currency:          'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
}

/**
 * Shorten a Solana public key or transaction hash.
 * e.g. "7xKX…9mQr"
 */
export function formatAddress(addr: string, chars = 4): string {
  if (!addr) return '';
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

/**
 * Human-readable relative time from a Unix ms timestamp.
 */
export function timeAgo(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);

  if (seconds < 60)          return `${seconds}s ago`;
  if (seconds < 3600)        return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)       return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7)   return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 86400 * 30)  return `${Math.floor(seconds / 86400 / 7)}w ago`;
  if (seconds < 86400 * 365) return `${Math.floor(seconds / 86400 / 30)}mo ago`;
  return `${Math.floor(seconds / 86400 / 365)}y ago`;
}

/**
 * Format APY as a percentage string.
 * e.g. 0.0842 → "8.42%"
 */
export function formatApy(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return '0.00%';
  return `${(n * 100).toFixed(2)}%`;
}

/**
 * Format token amounts (e.g. USDC with 6 decimals).
 */
export function formatTokenAmount(
  rawAmount: bigint | number,
  decimals = 6,
  symbol = 'USDC',
): string {
  const divisor = Math.pow(10, decimals);
  const amount  = Number(rawAmount) / divisor;
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

/**
 * Copy text to clipboard, returns a boolean promise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a deterministic color from a string (for avatar/chart colors).
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#8b5cf6', '#14b8a6', '#f0b429', '#06b6d4', '#f43f5e', '#84cc16'];
  return colors[Math.abs(hash) % colors.length];
}
