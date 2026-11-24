import { useState, useEffect } from 'react';
import { WifiDisconnected01Icon, ReloadIcon } from '@hugeicons/react';

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
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full bg-white rounded-3xl p-8 border border-clay-border shadow-clay-lg">
        {/* Offline Icon Container */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-[#FFF8E7] border border-[#E1AD01]/30 flex items-center justify-center text-[#E1AD01] shadow-clay-sm">
          <WifiDisconnected01Icon size={40} />
        </div>

        <h1 className="text-2xl font-black text-text-primary mb-2">No Internet Connection</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          It seems you're offline. Check your Wi-Fi or mobile network connection, then try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-[#6B3A1F] hover:bg-[#522c17] text-white rounded-full font-bold text-sm shadow-clay hover:shadow-clay-hover active:scale-[0.98] transition-all"
        >
          <ReloadIcon size={18} />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
