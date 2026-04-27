import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../api/authContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({});

  const validate = () => {
    const e: {email?: string; password?: string} = {};
    if (!email.includes('@')) e.email = 'Enter a valid email';
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
      await login(email, password, 'agent');
      navigate('/agent');
    } catch {
      setErrors({ general: 'Invalid email or password. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
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
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="clay-input w-full pl-11"
                />
              </div>
              {errors.email && <p className="text-xs text-status-error mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="clay-input w-full pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              Sign In <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

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