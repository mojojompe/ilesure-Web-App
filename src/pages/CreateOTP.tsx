import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { useAuth } from '../api/authContext';
import authApi from '../api/authApi';

export function CreateOTPPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setCountdown(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    const response = await authApi.sendOtp(user.email);
    if (!response.success) {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const handleVerify = async () => {
    if (otp.some(digit => !digit)) return;
    if (!user?.email) {
      setError('No email found. Please login again.');
      return;
    }
    setLoading(true);
    setError('');
    const otpString = otp.join('');
    const response = await authApi.verifyOtp(user.email, otpString);
    if (response.success) {
      navigate('/verification/agent');
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
          {user?.email && <p className="text-sm text-mustard mt-2">{user.email}</p>}
        </div>
        <div className="clay-card p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-clay-sm text-red-600 text-sm">{error}</div>}
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
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
              <button onClick={handleResend} disabled={loading} className="flex items-center justify-center text-sm text-mustard hover:underline disabled:opacity-50">
                <RefreshCw className="w-4 h-4 mr-1" /> Resend code
              </button>
            )}
          </div>
          <Button onClick={handleVerify} variant="primary" className="w-full" loading={loading} disabled={otp.some(digit => !digit)}>
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}