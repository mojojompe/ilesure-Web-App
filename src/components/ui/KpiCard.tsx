import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  variant?: 1 | 2;
  className?: string;
}

export function KpiCard({ title, value, change, icon: Icon, variant = 1, className }: KpiCardProps) {
  const gradient = variant === 1 ? 'bg-kpi-gradient-1' : 'bg-kpi-gradient-2';

  return (
    <div className={clsx('clay-card-hover p-5', className)}>
      <div className={clsx('rounded-clay-sm p-3 w-fit mb-3', gradient)}>
        <Icon className="w-5 h-5 text-burnt-brown" />
      </div>
      <p className="text-text-tertiary text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {change && (
        <p className={clsx('text-xs font-medium mt-2', change.startsWith('+') ? 'text-status-success' : 'text-status-error')}>
          {change}
        </p>
      )}
    </div>
  );
}