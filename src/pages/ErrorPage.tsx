import { Alert02Icon, ReloadIcon, Home01Icon } from '@hugeicons/react';

interface ErrorPageProps {
  error?: Error | null;
  reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full bg-white rounded-3xl p-8 border border-clay-border shadow-clay-lg">
        {/* Error Icon Container */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-status-error/10 border border-status-error/20 flex items-center justify-center text-status-error shadow-clay-sm">
          <Alert02Icon size={40} />
        </div>

        <h1 className="text-2xl font-black text-text-primary mb-2">Something Went Wrong</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          An unexpected error occurred while loading this view.
        </p>

        {error?.message && (
          <p className="text-xs text-text-tertiary bg-clay-border-light rounded-xl px-3 py-2 font-mono mb-6 max-w-sm mx-auto break-words">
            {error.message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {reset && (
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 w-full sm:flex-1 py-3 px-5 bg-[#6B3A1F] hover:bg-[#522c17] text-white rounded-full font-bold text-sm shadow-clay hover:shadow-clay-hover active:scale-[0.98] transition-all"
            >
              <ReloadIcon size={16} />
              <span>Try Again</span>
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center justify-center gap-2 w-full sm:flex-1 py-3 px-5 bg-white hover:bg-clay-border-light border border-clay-border text-text-secondary hover:text-text-primary rounded-full font-bold text-sm shadow-clay-sm active:scale-[0.98] transition-all"
          >
            <Home01Icon size={16} />
            <span>Go to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
