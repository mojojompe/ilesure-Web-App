import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* SVG illustration */}
        <div
          className="mx-auto mb-8 w-64 h-64"
          style={{ animation: 'notfound-float 4s ease-in-out infinite' }}
        >
          <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ground shadow */}
            <ellipse cx="120" cy="210" rx="70" ry="10" fill="#E5D6C8" opacity="0.5" />
            {/* House body */}
            <rect x="55" y="110" width="130" height="90" rx="10" fill="#FDF6E3" stroke="#C9962A" strokeWidth="2" />
            {/* Broken door */}
            <rect x="100" y="145" width="40" height="55" rx="6" fill="#C9962A" opacity="0.3" stroke="#C9962A" strokeWidth="1.5" />
            <path d="M100 145 L140 200" stroke="#C9962A" strokeWidth="1.5" opacity="0.5" />
            {/* Roof */}
            <path d="M45 115 L120 55 L195 115 Z" fill="#8B4513" stroke="#5C2E00" strokeWidth="2" />
            {/* Chimney */}
            <rect x="145" y="65" width="18" height="28" rx="3" fill="#5C2E00" />
            {/* Windows with X */}
            <rect x="68" y="125" width="35" height="30" rx="5" fill="#E8D5B0" stroke="#C9962A" strokeWidth="1.5" />
            <line x1="68" y1="125" x2="103" y2="155" stroke="#C62828" strokeWidth="2" />
            <line x1="103" y1="125" x2="68" y2="155" stroke="#C62828" strokeWidth="2" />
            <rect x="137" y="125" width="35" height="30" rx="5" fill="#E8D5B0" stroke="#C9962A" strokeWidth="1.5" />
            <line x1="137" y1="125" x2="172" y2="155" stroke="#C62828" strokeWidth="2" />
            <line x1="172" y1="125" x2="137" y2="155" stroke="#C62828" strokeWidth="2" />
            {/* Question marks floating */}
            <text x="30" y="90" fontSize="22" fill="#C9962A" opacity="0.7">?</text>
            <text x="185" y="80" fontSize="18" fill="#8B4513" opacity="0.5">?</text>
            <text x="170" y="50" fontSize="14" fill="#C9962A" opacity="0.6">?</text>
          </svg>
        </div>

        <div>
          <p className="text-8xl font-black text-burnt-brown mb-2">404</p>
          <h1 className="text-2xl font-bold text-text-primary mb-3">Page Not Found</h1>
          <p className="text-text-tertiary mb-8">
            This page has moved, been removed, or never existed. Let's get you back home.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-burnt-brown text-white rounded-pill font-semibold shadow-clay hover:bg-burnt-brown-dark transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
      <style>{`@keyframes notfound-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }`}</style>
    </div>
  );
}
