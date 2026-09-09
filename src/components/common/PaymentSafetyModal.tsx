import React, { useState } from 'react';
import { Cancel02Icon as X, Tick02Icon as Check } from '@hugeicons/react';

export interface PaymentSafetyModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount?: number;
  loading?: boolean;
}

export const PaymentSafetyModal: React.FC<PaymentSafetyModalProps> = ({
  visible,
  onClose,
  onConfirm,
  amount,
  loading = false,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!visible) return null;

  const handleClose = () => {
    if (loading) return;
    setAgreed(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!agreed || loading) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-surface border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Stay safe &amp; build your reputation
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Amount */}
        {typeof amount === 'number' && amount > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border/60 mb-5">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Payment Due
            </span>
            <span className="text-lg font-black text-mustard">
              ₦{amount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Policy Bullets */}
        <ul className="space-y-3.5 mb-6 text-sm sm:text-[15px] text-text-secondary leading-relaxed">
          <li className="flex items-start gap-2.5">
            <span className="text-text-primary text-base font-bold select-none">•</span>
            <span>
              Only accept and make payment through <strong className="font-bold text-text-primary">IleSure</strong>, ensuring Payment Protection.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-text-primary text-base font-bold select-none">•</span>
            <span>
              Receiving or making payment outside of IleSure violates your{' '}
              <a
                href="https://ilesure.com/terms-of-service"
                target="_blank"
                rel="noreferrer"
                className="text-[#16A34A] underline font-semibold hover:text-[#15803D]"
              >
                user agreement
              </a>{' '}
              and could result in suspension or legal action.
            </span>
          </li>
        </ul>

        {/* Checkbox */}
        <label className="flex items-center gap-3 select-none cursor-pointer mb-8 group">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={loading}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              agreed
                ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm'
                : 'border-border bg-background group-hover:border-text-secondary'
            }`}
          >
            {agreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
          <span className="text-sm font-medium text-text-primary">
            I understand IleSure's policies.
          </span>
        </label>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!agreed || loading}
            className={`px-7 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-sm ${
              agreed && !loading
                ? 'bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98]'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-70'
            }`}
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSafetyModal;
