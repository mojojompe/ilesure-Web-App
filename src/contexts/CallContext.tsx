import { createContext, useContext, type ReactNode } from 'react';
import { useCallEngine } from '../hooks/useCallEngine';

/**
 * Call state lives above the router, not inside the chat page.
 *
 * Two reasons: a call has to survive the user navigating away from the conversation, and
 * an incoming call has to be presentable from wherever they happen to be in the app.
 */

type CallContextValue = ReturnType<typeof useCallEngine>;

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const engine = useCallEngine();
  return <CallContext.Provider value={engine}>{children}</CallContext.Provider>;
}

export function useCall(): CallContextValue {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used inside a CallProvider');
  return context;
}

export default CallProvider;
