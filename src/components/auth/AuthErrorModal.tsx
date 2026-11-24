import { Cancel01Icon, Alert02Icon } from '@hugeicons/react';

export interface AuthErrorDetails {
  title: string;
  message: string;
  ctaText?: string;
  onCtaClick?: () => void;
  secondaryText?: string;
  onSecondaryClick?: () => void;
}

interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: AuthErrorDetails | null;
}

export function AuthErrorModal({ isOpen, onClose, details }: AuthErrorModalProps) {
  if (!isOpen || !details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Modal Window */}
      <div className="relative w-full max-w-md bg-[#FFFDF7] rounded-3xl p-6 md:p-8 shadow-clay-lg border border-[#E7DCD4] z-10 overflow-hidden animate-bounce-in">
        {/* Top Decorative Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B3A1F] via-[#E1AD01] to-[#6B3A1F]" />

        {/* Close Cancel Icon */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white border border-[#E7DCD4] flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-[#FAF1CC]/40 transition-colors"
          aria-label="Close modal"
        >
          <Cancel01Icon size={18} />
        </button>

        {/* Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-[#FFF8E7] border border-[#E1AD01]/30 flex items-center justify-center text-[#E1AD01] mb-5 shadow-clay-sm">
          <Alert02Icon size={28} />
        </div>

        {/* Title & Message */}
        <h2 className="text-xl font-black text-text-primary tracking-tight mb-2">
          {details.title}
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-6 whitespace-pre-line">
          {details.message}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col gap-2.5">
          {details.ctaText && (
            <button
              onClick={() => {
                if (details.onCtaClick) details.onCtaClick();
                else onClose();
              }}
              className="w-full py-3.5 px-5 rounded-full bg-[#6B3A1F] hover:bg-[#522c17] text-white font-bold text-sm shadow-clay hover:shadow-clay-hover active:scale-[0.98] transition-all"
            >
              {details.ctaText}
            </button>
          )}

          {details.secondaryText && (
            <button
              onClick={() => {
                if (details.onSecondaryClick) details.onSecondaryClick();
                else onClose();
              }}
              className="w-full py-3 px-5 rounded-full bg-white hover:bg-[#FAF1CC]/30 border border-[#E7DCD4] text-text-secondary hover:text-text-primary font-bold text-xs active:scale-[0.98] transition-all"
            >
              {details.secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
