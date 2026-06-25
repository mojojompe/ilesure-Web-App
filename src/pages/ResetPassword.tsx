import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Key, ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import authApi from '../api/authApi';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authApi.resetPassword(email, token, password);
      if (response.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4"
        style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_reset_password.png')" }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-status-success" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Password Reset!</h1>
            <p className="text-text-tertiary mt-1">
              Your password has been changed successfully.
            </p>
          </div>
          <div className="clay-card p-6">
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Sign In <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_reset_password.png')" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Set New Password</h1>
          <p className="text-text-tertiary mt-1">
            Choose a strong password you'll remember
          </p>
        </div>

        <div className="clay-card p-6">
          {error && (
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-md">
              <p className="text-sm text-status-error text-center">{error}</p>
            </div>
          )}
          
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
                  placeholder="Your registered email"
                  className="clay-input w-full pl-11"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="clay-input w-full pl-11"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="clay-input w-full pl-11"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Reset Password <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
