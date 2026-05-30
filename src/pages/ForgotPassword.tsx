import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import authApi from '../api/authApi';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        setSent(true);
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      alert(error.response?.data?.error?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-status-success" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
            <p className="text-text-tertiary mt-1">
              We've sent a password reset link to <span className="font-semibold">{email}</span>
            </p>
          </div>

          <div className="clay-card p-6">
            <div className="text-center mb-4">
              <p className="text-sm text-text-secondary">
                Didn't receive the email? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-mustard hover:underline">
                  try again
                </button>
              </p>
            </div>

            <Link to="/login">
              <Button variant="secondary" className="w-full mt-4">
                <ArrowRight className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Forgot Password?</h1>
          <p className="text-text-tertiary mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="clay-card p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="clay-input w-full pl-11"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Send Reset Link <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Remember your password?{' '}
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