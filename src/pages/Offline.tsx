import { useState, useEffect } from 'react';


export function Offline() {
  const [isBack, setIsBack] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsBack(true);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  if (isBack) {
    window.location.reload();
    return null;
  }

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Animated signal towers SVG */}
        <div
          className="mx-auto mb-8 w-64 h-64"
        >
          <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cloud with rain */}
            <ellipse cx="120" cy="75" rx="55" ry="32" fill="#D5C4B0" />
            <ellipse cx="90" cy="85" rx="40" ry="28" fill="#C9B8A0" />
            <ellipse cx="150" cy="88" rx="32" ry="24" fill="#C9B8A0" />
            {/* Rain drops */}
            {[95, 110, 125, 140, 105, 130].map((x, i) => (
              <line
                key={x}
                x1={x} y1={108 + (i % 2) * 8} x2={x - 6} y2={130 + (i % 2) * 8}
                stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'rain-drop 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
              />
            ))}

            {/* WiFi icon — broken */}
            <path d="M75 170 Q120 140 165 170" stroke="#C9962A" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M88 183 Q120 162 152 183" stroke="#C9962A" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <circle cx="120" cy="197" r="6" fill="#C9962A" opacity="0.5" />
            {/* X through wifi */}
            <line x1="100" y1="150" x2="140" y2="210" stroke="#C62828" strokeWidth="3" strokeLinecap="round" />
            <line x1="140" y1="150" x2="100" y2="210" stroke="#C62828" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">No Internet Connection</h1>
          <p className="text-text-tertiary mb-8">
            It seems you're offline. Check your Wi-Fi or mobile data, then try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-burnt-brown text-white rounded-pill font-semibold shadow-clay hover:bg-burnt-brown-dark transition-colors"
          >
            ↻ Try Again
          </button>
        </div>
      </div>
      <style>{`@keyframes rain-drop { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
    </div>
  );
}
