import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { useAuth, PENDING_EMAIL_KEY } from '../api/authContext';
import authApi from '../api/authApi';

const RESEND_COOLDOWN = 60;

export function CreateOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setSession } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // QA-AGT-003 / QA-CO-002: the email must survive the signup → OTP handoff even when
  // the auth context has not been populated (or the page was refreshed). Resolve it from
  // router state, then the signed-in user, then the pending-signup marker.
  const email = useMemo<string>(() => {
    const fromState = (location.state as { email?: string } | null)?.email;
    return fromState || user?.email || sessionStorage.getItem(PENDING_EMAIL_KEY) || '';
  }, [location.state, user?.email]);
  // Non-fatal problems from signup (bank save / document upload) — the account exists, so
  // tell the user what to redo in Settings instead of hiding it.
  const signupWarnings = ((location.state as { warnings?: string[] } | null)?.warnings) || [];

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

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

  const handleResend = async () => {
    if (!email) {
      setError('No email found. Please sign up or log in again.');
      return;
    }
    // QA-CO-003: only reset the cooldown once the backend confirms a new code was sent.
    setResending(true);
    setError('');
    setInfo('');
    const response = await authApi.sendOtp(email);
    setResending(false);
    if (response.success && response.alreadyVerified) {
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
      setInfo('This email is already verified. You can log in.');
      return;
    }
    if (response.success) {
      setOtp(['', '', '', '', '', '']);
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
      setInfo(`A new code has been sent to ${email}.`);
      inputRefs.current[0]?.focus();
    } else {
      setError(response.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleVerify = async () => {
    if (otp.some(digit => !digit)) return;
    if (!email) {
      setError('No email found. Please sign up or log in again.');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    const otpString = otp.join('');
    const response = await authApi.verifyOtp(email, otpString);
    if (response.success) {
      // Persist the verified session (tokens + user with isVerified=true) so the rest of
      // onboarding and the dashboard see a verified user without a re-login.
      if (response.user && response.accessToken) {
        setSession(response.user, response.accessToken);
      }
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
      const role = response.user?.role || user?.role;
      const isCompany = role === 'company' || role === 'company_admin';
      navigate(isCompany ? '/verification/company' : '/verification/agent', { replace: true });
    } else {
      setError(response.error?.message || 'Invalid OTP. Please try again.');
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
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_otp.png')" }}
    >
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="flex items-center text-mustard text-sm hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Verify OTP</h1>
          <p className="text-text-tertiary mt-1">Enter the 6-digit code sent to your email</p>
          {email ? (
            <p className="text-sm text-mustard mt-2">{email}</p>
          ) : (
            <p className="text-sm text-red-600 mt-2">
              We couldn't find your email. <button onClick={() => navigate('/login')} className="underline">Log in</button> to continue.
            </p>
          )}
        </div>
        <div className="clay-card p-6">
          {signupWarnings.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-clay-sm text-amber-800 text-sm space-y-1">
              <p className="font-semibold">Your account was created, but:</p>
              <ul className="list-disc pl-4">{signupWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-clay-sm text-red-600 text-sm">{error}</div>}
          {info && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-clay-sm text-green-700 text-sm">{info}</div>}
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
              <button onClick={handleResend} disabled={loading || resending || !email} className="flex items-center justify-center mx-auto text-sm text-mustard hover:underline disabled:opacity-50">
                <RefreshCw className={clsx('w-4 h-4 mr-1', resending && 'animate-spin')} /> {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>
          <Button onClick={handleVerify} variant="primary" className="w-full" loading={loading} disabled={otp.some(digit => !digit) || !email}>
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
