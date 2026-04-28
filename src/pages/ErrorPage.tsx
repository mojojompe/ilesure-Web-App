import { motion } from 'framer-motion';

interface ErrorPageProps {
  error?: Error | null;
  reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Broken gear/cog illustration */}
        <motion.div
          className="mx-auto mb-8 w-64 h-64"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
              { x: 60, y: 60 }, { x: 180, y: 65 }, { x: 55, y: 175 }, { x: 185, y: 180 },
            ].map((p, i) => (
              <motion.circle
                key={i} cx={p.x} cy={p.y} r="5" fill="#F5C842"
                animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
              />
            ))}
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
        </motion.div>
      </div>
    </div>
  );
}
