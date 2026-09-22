import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail01Icon, ArrowRight01Icon, ArrowLeft01Icon, ReloadIcon } from '@hugeicons/react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { useAuth } from '../api/authContext';
import authApi from '../api/authApi';

const RESEND_COOLDOWN = 60;

/**
 * Landing point for a deleted account. The backend now refuses /auth/login outright for a
 * deleted account (403 ACCOUNT_DELETED, nextStep 'reactivate'), rather than letting the user
 * in and asking them to reactivate later, so Login.tsx and the Google callback both send the
 * user here instead of surfacing a dead-end "invalid credentials" error.
 *
 * Mirrors CreateOTP.tsx's two-stage shape (request a code, then confirm it) but against the
 * separate /auth/reactivate/* endpoints, and completes the session exactly like Login.tsx's
 * success path once the code is confirmed.
 */
export function ReactivateAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  // The address arrives either from Login.tsx's navigate state or a `?email=` query param
  // (e.g. a bookmarked or shared link), and stays editable if neither is present.
  const initialEmail = useMemo<string>(() => {
    const fromState = (location.state as { email?: string } | null)?.email;
    if (fromState) return fromState;
    return new URLSearchParams(location.search).get('email') || '';
  }, [location.state, location.search]);

  const [stage, setStage] = useState<'request' | 'confirm'>(initialEmail ? 'confirm' : 'request');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (stage !== 'confirm') return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [stage, countdown]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Always succeeds ({ success: true }) regardless of whether the address exists or is
      // actually deleted, so it cannot be used to probe for registered emails.
      await authApi.requestReactivation(email);
      setStage('confirm');
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send the reactivation code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setInfo('');
    try {
      await authApi.requestReactivation(email);
      setOtp(['', '', '', '', '', '']);
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
      setInfo(`A new code has been sent to ${email}.`);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length < 2) return;
    e.preventDefault();
    const newOtp = ['', '', '', '', '', ''];
    digits.split('').forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    if (otp.some(digit => !digit)) return;
    setLoading(true);
    setError('');
    setInfo('');
    const response = await authApi.confirmReactivation(email, otp.join(''));
    if (response.success && response.user && response.accessToken) {
      // Complete the session exactly like Login.tsx's success path: only the access token is
      // persisted (W-H1), and routing follows the same nextStep/role rules.
      setSession(response.user, response.accessToken);

      if (response.nextStep === 'update_password') {
        navigate('/update-password');
        return;
      }

      const userRole = response.user.role;
      if (userRole === 'company_admin' || userRole === 'company') {
        navigate('/company');
      } else if (userRole === 'agent' || userRole === 'landlord' || userRole === 'sub_agent') {
        navigate('/agent');
      } else {
        navigate('/');
      }
    } else {
      setError(response.error?.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_login.png')" }}
    >
      <div className="w-full max-w-md">
        {stage === 'confirm' ? (
          <button onClick={() => setStage('request')} className="flex items-center text-mustard text-sm hover:underline mb-6">
            <ArrowLeft01Icon className="w-4 h-4 mr-1" /> Back
          </button>
        ) : (
          <div className="w-16 h-16 mx-auto mb-4 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Reactivate your account</h1>
          <p className="text-text-tertiary mt-1">
            {stage === 'request'
              ? "Enter the email on your deleted account and we'll send you a code to bring it back."
              : 'Enter the 6-digit code sent to your email'}
          </p>
          {stage === 'confirm' && <p className="text-sm text-mustard mt-2">{email}</p>}
        </div>

        <div className="clay-card p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-clay-sm text-red-600 text-sm">{error}</div>}
          {info && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-clay-sm text-green-700 text-sm">{info}</div>}

          {stage === 'request' ? (
            <form onSubmit={handleRequest}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="clay-input w-full pl-11"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Send code <ArrowRight01Icon className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={clsx(
                      'w-12 h-14 rounded-clay-sm text-center text-xl font-bold',
                      'border-2 transition-all outline-none',
                      digit ? 'border-mustard bg-mustard-pale' : 'border-clay-border bg-clay-border-light',
                      'focus:border-mustard focus:ring-2 focus:ring-mustard/20'
                    )}
                  />
                ))}
              </div>
              <div className="text-center mb-6">
                {!canResend ? (
                  <p className="text-sm text-text-tertiary">Resend code in <span className="font-semibold text-mustard">{formatTime(countdown)}</span></p>
                ) : (
                  <button onClick={handleResend} disabled={loading || resending} className="flex items-center justify-center mx-auto text-sm text-mustard hover:underline disabled:opacity-50">
                    <ReloadIcon className={clsx('w-4 h-4 mr-1', resending && 'animate-spin')} /> {resending ? 'Sending…' : 'Resend code'}
                  </button>
                )}
              </div>
              <Button onClick={handleConfirm} variant="primary" className="w-full" loading={loading} disabled={otp.some(digit => !digit)}>
                Reactivate account
              </Button>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Remembered a different account?{' '}
              <Link to="/login" className="text-mustard font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReactivateAccountPage;
