import type { ReactNode } from 'react';
import { EmptyIllustration, type EmptyIllustrationName } from './EmptyIllustration';

interface EmptyStateProps {
  illustration: EmptyIllustrationName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Smaller artwork and spacing, for dashboard cards and table bodies. */
  compact?: boolean;
  className?: string;
}

/** The one empty state for the portal: illustration, what is missing, and what to do next. */
export function EmptyState({ illustration, title, description, action, compact, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-12 px-6'} ${className}`}>
      <EmptyIllustration name={illustration} className={compact ? 'w-32 h-auto mb-3' : 'w-48 h-auto mb-5'} />
      <h3 className={`font-bold text-text-primary ${compact ? 'text-sm' : 'text-lg'}`}>{title}</h3>
      {description && (
        <p className={`text-text-tertiary max-w-sm mt-1 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>
      )}
      {action && <div className={compact ? 'mt-3' : 'mt-5'}>{action}</div>}
    </div>
  );
}
