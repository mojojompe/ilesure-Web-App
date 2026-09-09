import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail01Icon, LockIcon, ViewIcon, ViewOffIcon, ArrowRight01Icon, ArrowLeft01Icon } from '@hugeicons/react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../api/authContext';
import { API_BASE_URL } from '../api/config';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.nextStep === 'update_password') {
          navigate('/update-password');
          return;
        }

        const userRole = result.user?.role;
        if (userRole === 'company_admin' || userRole === 'company') {
          navigate('/company');
        } else if (userRole === 'agent' || userRole === 'landlord' || userRole === 'sub_agent') {
          navigate('/agent');
        } else {
          navigate('/');
        }
      } else if (result.errorCode === 'EMAIL_NOT_VERIFIED') {
        // QA-AGT-031: the credentials were right; the address was never verified. Hand them to
        // the OTP screen with the address prefilled, it can resend a code, so an expired
        // original is not a dead end.
        navigate('/create-otp', { state: { email: result.email || email } });
      } else {
        setErrors({ general: result.error || 'Invalid email or password. Try again.' });
      }
    } catch {
      setErrors({ general: 'Invalid email or password. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_login.png')" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-text-tertiary mt-1">Sign in to find your safe home</p>
        </div>

        <div className="clay-card p-6">
          {errors.general && (
            <div className="mb-4 p-3 rounded-clay-sm bg-status-error/10 text-status-error text-sm flex items-center gap-2">
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="clay-input w-full pl-11"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-status-error mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="clay-input w-full pl-11 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  /* A11Y-FIX (QA-A11Y-002): icon-only, so a screen reader announced it
                     as just "button". aria-pressed carries the state as well. */
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                >
                  {showPassword ? <ViewOffIcon className="w-5 h-5" /> : <ViewIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-status-error mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-end mb-6">
              <Link to="/forgot-password" className="text-sm text-mustard hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Sign In <ArrowRight01Icon className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Google sign-in (P-L1). The backend does this as a redirect, not a client-side
              token exchange, so this is a full-page navigation rather than a fetch.

              `intent=portal` tells the server not to auto-create an account for a Google
              address it has never seen: it would create a `student`, which on this portal
              means handing an agent a renter account and then refusing them their own
              dashboard. Unknown addresses are told to register instead.

              This app's origin must be in the server's OAUTH_ALLOWED_ORIGINS (or be
              FRONTEND_URL), otherwise the callback answers with JSON instead of redirecting
              and the landing page reports a failed sign-in. */}
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-clay-border" />
            <span className="text-xs text-text-tertiary">or</span>
            <span className="h-px flex-1 bg-clay-border" />
          </div>

          <button
            type="button"
            onClick={() => {
              const returnTo = `${window.location.origin}/auth/google/callback?intent=portal`;
              window.location.href =
                `${API_BASE_URL}/auth/google/login?redirect=${encodeURIComponent(returnTo)}`;
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-clay-sm border border-clay-border bg-white py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-clay-border-light"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-mustard font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}