import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface StatusBadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'brown' | 'mustard';
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ variant = 'default', children, className }: StatusBadgeProps) {
  const variants = {
    success: 'bg-status-success/10 text-status-success',
    warning: 'bg-mustard/10 text-mustard',
    error: 'bg-status-error/10 text-status-error',
    info: 'bg-status-info/10 text-status-info',
    default: 'bg-clay-border text-text-secondary',
    brown: 'bg-burnt-brown text-white',
    mustard: 'bg-mustard text-white',
  };

  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold tracking-wide', variants[variant], className)}>
      {children}
    </span>
  );
}