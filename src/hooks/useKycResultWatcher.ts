import { useEffect, useRef } from 'react';
import { userApi } from '../api/user';

const POLL_MS = 15_000;
const GIVE_UP_MS = 10 * 60_000;

export interface KycSyncResult {
  ninVerified?: boolean;
  bvnVerified?: boolean;
  cacVerified?: boolean;
}

/**
 * While a Dojah check has been started but has no result yet, ask the server to fetch it.
 *
 * The widget's `onSuccess` only fires when the check is finished in this tab. On a computer the
 * widget offers to continue on a phone (QR code); when it is finished there, this tab never hears
 * back, so the result was only recorded if Dojah's webhook reached us. `/kyc/sync` looks the
 * server-owned reference up with Dojah directly, so polling it (and re-checking when the person
 * comes back to this tab) records the phone result without them having to find a Sync button.
 */
export function useKycResultWatcher(active: boolean, onResult: (result: KycSyncResult) => void) {
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    let inFlight = false;
    let stopped = false;

    const check = async () => {
      if (inFlight || stopped) return;
      if (Date.now() - startedAt > GIVE_UP_MS) return;
      inFlight = true;
      try {
        const res = await userApi.syncKyc();
        if (!stopped && res.success && res.data) onResultRef.current(res.data);
      } finally {
        inFlight = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    const timer = window.setInterval(check, POLL_MS);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active]);
}
