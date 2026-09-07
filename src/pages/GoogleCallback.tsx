import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/authContext';
import userApi from '../api/user';

/**
 * Landing point for Google sign-in on the agent/company portal.
 *
 * The backend does Google auth as a redirect, not a client-side token exchange:
 *
 *   GET {API}/auth/google/login?redirect=<this page>?intent=portal
 *     -> Google
 *     -> GET {API}/auth/google/callback
 *     -> 302 back here with either the session or ?error=<code>
 *
 * `intent=portal` matters. Without it the server auto-creates a `student` for any Google
 * address it has never seen — which on this portal would hand an agent a renter account and
 * then bounce them off their own dashboard. With it, an unknown address is refused and told to
 * register properly, because an agent or company account needs a role, a company name, bank
 * details and KYC that a Google profile does not carry.
 *
 * SECURITY NOTE — not fixed here: the server returns the session in the QUERY STRING, which
 * `authController.googleCallback` flags in its own TODO ("replace token-in-URL delivery with a
 * one-time code exchanged over POST (PKCE)"). Tokens in a URL reach browser history and can
 * reach referrer headers. This page strips them via replaceState before its first await, which
 * narrows that exposure without closing it.
 *
 * The refresh token is deliberately ignored: per W-H1 this app keeps only the short-lived
 * access token, and refresh happens from the httpOnly cookie the callback already set.
 */
const PORTAL_ROLES = ['agent', 'landlord', 'company', 'company_admin', 'sub_agent'];

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // StrictMode double-mounts effects in development and the token is single-use.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const serverError = params.get('error');

    // Before anything else, and before any await: do not leave credentials in the address bar
    // or in history.
    window.history.replaceState({}, document.title, window.location.pathname);

    if (serverError) {
      setError(
        serverError === 'no_account'
          ? 'No account found for that Google address. Please create an account first — agents and companies need a few extra details we cannot take from Google.'
          : serverError === 'password_account'
            ? 'This email is already registered with a password. Please sign in with your email and password.'
            : 'Google sign-in did not complete. Please try again, or sign in with your email.'
      );
      return;
    }

    if (!accessToken) {
      // No token and no reason: cancelled at Google, or this origin is not in the server's
      // OAUTH_ALLOWED_ORIGINS allowlist so it answered with JSON instead of redirecting.
      setError('Google sign-in did not complete. Please try again, or sign in with your email.');
      return;
    }

    (async () => {
      try {
        // The redirect carries no profile, so read it with the session we were just handed.
        // `setSession` is called only after the role check passes, so a renter never gets a
        // portal session written to storage.
        const res = await userApi.getProfile(accessToken);
        const user: any = res?.data;
        if (!res?.success || !user) throw new Error('profile unavailable');

        if (!PORTAL_ROLES.includes(user.role)) {
          setError('This portal is for agents, landlords, and companies. Please use the mobile app.');
          return;
        }

        setSession(user, accessToken);
        navigate(user.role === 'company' || user.role === 'company_admin' ? '/company' : '/agent', { replace: true });
      } catch {
        setError('We could not complete your sign-in. Please try again.');
      }
    })();
    // Runs once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-clay-bg">
      {error ? (
        <>
          <p className="text-base font-bold text-text-primary mb-2">Sign-in failed</p>
          <p className="text-sm text-text-secondary mb-6 max-w-sm leading-snug">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="rounded-clay-sm bg-burnt-brown px-6 py-3 text-sm font-bold text-white"
          >
            Back to sign in
          </button>
        </>
      ) : (
        <>
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-clay-border border-t-burnt-brown" />
          <p className="text-sm text-text-secondary">Signing you in…</p>
        </>
      )}
    </div>
  );
}

export default GoogleCallbackPage;
