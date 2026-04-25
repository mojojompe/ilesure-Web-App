import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'mustard' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-pill transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  const variants = {
    primary: 'bg-btn-primary text-white shadow-clay-sm hover:shadow-clay hover:brightness-110',
    secondary: 'bg-transparent text-burnt-brown border-2 border-burnt-brown hover:bg-burnt-brown-pale',
    mustard: 'bg-btn-mustard text-white shadow-clay-sm hover:shadow-clay hover:brightness-110',
    success: 'bg-status-success text-white hover:opacity-90',
    danger: 'bg-status-error text-white hover:opacity-90',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4\" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}