import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';

export function CreateOTPPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleResend = () => {
    setCountdown(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
  };

  const handleVerify = async () => {
    if (otp.some(digit => !digit)) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate('/login');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="flex items-center text-mustard text-sm hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Verify OTP</h1>
          <p className="text-text-tertiary mt-1">Enter the 6-digit code sent to your phone</p>
        </div>

        <div className="clay-card p-6">
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
              <p className="text-sm text-text-tertiary">
                Resend code in <span className="font-semibold text-mustard">{formatTime(countdown)}</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="flex items-center justify-center text-sm text-mustard hover:underline"
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Resend code
              </button>
            )}
          </div>

          <Button
            onClick={handleVerify}
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={otp.some(digit => !digit)}
          >
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}