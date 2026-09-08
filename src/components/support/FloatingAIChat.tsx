import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Bot, Maximize2, Minimize2 } from 'lucide-react';

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // If already on the dedicated support page, hide floating widget to avoid duplicate iframe
  if (location.pathname.includes('/support')) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-burnt-brown hover:bg-burnt-brown-dark text-white rounded-full shadow-clay-lg hover:shadow-clay-hover hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/20"
          aria-label="Open AI Support Chat"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-mustard-light animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-burnt-brown" />
          </div>
          <span className="text-xs font-bold tracking-wide">AI Support</span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white rounded-clay-lg shadow-clay-lg border border-clay-border overflow-hidden ${
            isExpanded
              ? 'inset-4 md:inset-10'
              : 'bottom-6 right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Window Header */}
          <div className="px-4 py-3 bg-sidebar-gradient text-white flex items-center justify-between shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-mustard-light">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  iléSure AI Support
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-white/60">Instant Platform Help</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-clay-sm hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title={isExpanded ? 'Restore' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-clay-sm hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Iframe Body */}
          <div className="flex-1 w-full h-full relative bg-cream-50/30">
            <iframe
              src="https://www.chatbase.co/chatbot-iframe/4G95TFjKNyu5gD5mDwt4G"
              title="iléSure Floating AI Chat"
              className="absolute inset-0 w-full h-full border-0"
              allow="microphone"
            />
          </div>
        </div>
      )}
    </>
  );
}
