
interface ErrorPageProps {
  error?: Error | null;
  reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Broken gear/cog illustration */}
        <div
          className="mx-auto mb-8 w-64 h-64"
          style={{ animation: 'gear-wobble 3s ease-in-out infinite' }}
        >
          <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer broken gear */}
            <path
              d="M120 40 L130 58 L150 52 L158 70 L178 72 L178 92 L196 100 L188 118 L200 132 L188 146 L192 166 L174 174 L170 194 L150 196 L142 214 L122 210 L110 224 L94 214 L76 220 L68 202 L48 196 L46 176 L28 166 L34 146 L22 132 L36 118 L28 100 L48 90 L50 70 L70 68 L80 50 Z"
              fill="#F5E6D0" stroke="#C9962A" strokeWidth="2.5"
            />
            {/* Inner circle */}
            <circle cx="120" cy="130" r="38" fill="#FDF6E3" stroke="#C9962A" strokeWidth="2" />
            {/* Crack / lightning bolt */}
            <path d="M112 105 L108 125 L118 125 L116 155" stroke="#C62828" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Stars / sparks */}
            {[
              { x: 60, y: 60, d: '0s' }, { x: 180, y: 65, d: '0.4s' },
              { x: 55, y: 175, d: '0.8s' }, { x: 185, y: 180, d: '1.2s' },
            ].map((p) => (
              <circle
                key={p.x}
                cx={p.x} cy={p.y} r="5" fill="#F5C842"
                style={{ animation: `spark-pulse 1.5s ease-in-out infinite`, animationDelay: p.d }}
              />
            ))}

          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">Something Went Wrong</h1>
          <p className="text-text-tertiary mb-4">
            An unexpected error occurred. Our team has been notified.
          </p>
          {error?.message && (
            <p className="text-xs text-text-tertiary bg-clay-border-light rounded-clay-sm px-3 py-2 font-mono mb-6 max-w-sm mx-auto">
              {error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            {reset && (
              <button
                onClick={reset}
                className="px-6 py-3 bg-burnt-brown text-white rounded-pill font-semibold shadow-clay hover:bg-burnt-brown-dark transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-white border border-clay-border text-text-primary rounded-pill font-semibold shadow-clay hover:bg-clay-border-light transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes gear-wobble { 0%,100% { transform: rotate(0deg); } 33% { transform: rotate(5deg); } 66% { transform: rotate(-5deg); } } @keyframes spark-pulse { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
