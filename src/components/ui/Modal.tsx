import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-clay shadow-clay-lg w-full p-6 animate-bounce-in max-h-[90vh] overflow-y-auto', sizes[size])}>
        {title && (
          <h2 className="text-lg font-bold text-text-primary mb-4 sticky top-0 bg-white z-10">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}