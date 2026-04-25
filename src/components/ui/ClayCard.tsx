import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface ClayCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function ClayCard({ children, className, hover = false }: ClayCardProps) {
  return (
    <div className={clsx(
      'bg-white rounded-clay shadow-clay border border-clay-border transition-all duration-200 ease-out',
      hover && 'hover:shadow-clay-hover hover:-translate-y-0.5',
      className
    )}>
      {children}
    </div>
  );
}