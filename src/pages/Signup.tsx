import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, Building2, Search, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import type { UserRole, SignupData } from '../types';
import authApi from '../api/authApi';
import paymentsApi from '../api/payments';
import agentApi from '../api/agent';
import companyApi from '../api/company';
import { useAuth, PENDING_EMAIL_KEY } from '../api/authContext';

function getPasswordStrength(password: string): { label: string; color: string; progress: number } {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  if (score <= 1) return { label: 'Weak', color: 'bg-status-error', progress: 25 };
  if (score <= 2) return { label: 'Medium', color: 'bg-mustard', progress: 50 };
  if (score <= 3) return { label: 'Medium', color: 'bg-mustard', progress: 75 };
  return { label: 'Strong', color: 'bg-status-success', progress: 100 };
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={clsx(
              'w-3 h-3 rounded-full transition-all',
              i + 1 === currentStep ? 'bg-mustard w-6' : i + 1 < currentStep ? 'bg-status-success' : 'bg-clay-border'
            )}
          />
          {i < totalSteps - 1 && (
            <div
              className={clsx(
                'w-8 h-0.5 transition-all',
                i + 1 < currentStep ? 'bg-status-success' : 'bg-clay-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [step, setStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<SignupData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'agent',
  });

  const [companyName, setCompanyName] = useState('');

  // Derived rather than held in state: role is the single source of truth, so the two
  // cannot drift apart if the role is ever changed from somewhere else.
  const isCompany = formData.role === 'company';

  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [selectedBank, setSelectedBank] = useState<{ name: string; code: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [showBankList, setShowBankList] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  useEffect(() => {
    paymentsApi.listBanks().then(setBanks);
  }, []);

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleResolveAccount = async () => {
    if (!selectedBank || accountNumber.length < 10) return;
    setBankLoading(true);
    setBankError('');
    try {
      const res = await paymentsApi.resolveAccount(accountNumber, selectedBank.code);
      if (!res?.accountName) throw new Error('We could not confirm this account. Check the bank and account number.');
      setAccountName(res.accountName);
    } catch (err: any) {
      // QA-AGT-001: surface the failure inline instead of silently doing nothing.
      setAccountName('');
      setBankError(err?.message || 'We could not verify this account. Check the bank and account number and try again.');
    }
    setBankLoading(false);
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) return;
      if (formData.password !== formData.confirmPassword) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!formData.phone) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      await handleSubmit();
    }
  };

  /** Bank setup is optional: clear anything half-entered and create the account without a payout account. */
  const handleSkipBank = async () => {
    setSelectedBank(null);
    setAccountNumber('');
    setAccountName('');
    setBankError('');
    await handleSubmit();
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const registerData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role as UserRole,
        ...(isCompany && companyName ? { companyName } : {}),
      };
      
      const response = await authApi.register(registerData);

      if (response.success && response.user && response.accessToken) {
        // QA-AGT-003 / QA-CO-002: establish the session through the auth context so the
        // OTP page sees the user immediately (a bare localStorage write was invisible to
        // React state until a hard reload). The pending-email marker survives refreshes.
        // SECURITY-FIX (W-H1): setSession never persists the refresh token.
        setSession(response.user, response.accessToken);
        const email = response.user.email || formData.email;
        sessionStorage.setItem(PENDING_EMAIL_KEY, email);

        const warnings: string[] = [];

        // QA-AGT-005: persist the verified bank account server-side right away.
        if (selectedBank && accountNumber && accountName) {
          try {
            const subaccountData = {
              businessName: isCompany ? companyName : formData.fullName,
              bankCode: selectedBank.code,
              bankName: selectedBank.name,
              accountNumber,
              accountName,
            };
            const subRes = isCompany
              ? await companyApi.setupSubaccount(subaccountData)
              : await agentApi.setupSubaccount(subaccountData);
            if (!subRes.success) warnings.push(subRes.error?.message || 'Bank account could not be saved. You can add it from Settings.');
          } catch (subErr: any) {
            warnings.push(subErr?.message || 'Bank account could not be saved. You can add it from Settings.');
          }
        }

        navigate('/create-otp', { state: { email, warnings } });
      } else {
        setError(response.error?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          {isCompany ? 'Company Representative Name' : 'Full Name'}
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className="clay-input w-full pl-11"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="clay-input w-full pl-11"
            required
          />
        </div>
      </div>

      {isCompany && (
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Company Name
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
              className="clay-input w-full pl-11"
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            className="clay-input w-full pl-11 pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formData.password && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-tertiary">Strength:</span>
              <span className={clsx('font-semibold', passwordStrength.color.replace('bg-', 'text-'))}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="h-1.5 bg-clay-border rounded-full overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', passwordStrength.color)}
                style={{ width: `${passwordStrength.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className="clay-input w-full pl-11 pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-status-error mt-1">Passwords do not match</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="08012345678"
            className="clay-input w-full pl-11"
            required
          />
        </div>
        <p className="text-xs text-text-tertiary mt-1">Nigerian mobile number, e.g. 08012345678. Tenants and our team use this number to reach you.</p>
      </div>
    </div>
  );

  const renderBankStep = () => (
    <div className="space-y-4">
      {/* Consent sits at the top of the final step, so it is read before the account is created. */}
      <label className="flex items-start gap-3 rounded-clay-sm border border-clay-border bg-clay-border-light p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={e => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-mustard cursor-pointer"
        />
        <span className="text-sm leading-5 text-text-secondary">
          I agree to the{' '}
          <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="font-bold text-mustard underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-bold text-mustard underline">
            Privacy Policy
          </a>.
        </span>
      </label>
      <p className="text-sm text-text-secondary">
        Set up your bank account to receive rent payments automatically with instant split settlements.
      </p>
      <div className="relative">
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Select Bank
        </label>
        <button
          type="button"
          onClick={() => setShowBankList(!showBankList)}
          className="clay-input w-full text-left flex items-center justify-between"
        >
          <span className={selectedBank ? '' : 'text-text-tertiary'}>
            {selectedBank?.name || 'Choose your bank'}
          </span>
          <Search className="w-4 h-4 text-text-tertiary" />
        </button>
        {showBankList && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-clay-border rounded-clay-sm shadow-clay max-h-48 overflow-y-auto">
            <div className="sticky top-0 bg-white p-2 border-b border-clay-border">
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search banks..."
                className="clay-input w-full text-sm py-1.5"
                autoFocus
              />
            </div>
            {filteredBanks.slice(0, 30).map((bank) => (
              <button
                key={bank.code}
                type="button"
                onClick={(e) => {
                  // The list sits inside a form; without these the click submits it.
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedBank(bank);
                  setShowBankList(false);
                  setBankSearch('');
                  setAccountName('');
                  setBankError('');
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-mustard-pale transition-colors ${
                  selectedBank?.code === bank.code ? 'bg-mustard-pale font-semibold' : ''
                }`}
              >
                {bank.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Account Number
        </label>
        <input
          type="text"
          inputMode="numeric"
          name="nuban-account-number"
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          value={accountNumber}
          onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setAccountName(''); setBankError(''); }}
          placeholder="Enter 10-digit account number"
          className="clay-input w-full"
          maxLength={10}
        />
      </div>
      {bankError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {bankError}
        </p>
      )}
      <button
        type="button"
        onClick={handleResolveAccount}
        disabled={!selectedBank || accountNumber.length < 10 || bankLoading}
        className="clay-input w-full text-center text-sm font-semibold py-2 bg-mustard-pale border-mustard disabled:opacity-50"
      >
        {bankLoading ? 'Verifying...' : 'Verify Account'}
      </button>
      {accountName && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-clay-sm">
          <p className="text-xs text-text-tertiary font-semibold uppercase tracking-wider mb-1">Account Name</p>
          <p className="text-sm font-bold text-green-700">{accountName}</p>
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSkipBank}
          className="text-sm text-text-tertiary hover:text-text-secondary font-medium underline underline-offset-2"
        >
          Skip — I'll do this later
        </button>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Create Account';
      case 2: return 'Phone Number';
      case 3: return 'Bank Account Setup';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Enter your basic information';
      case 2: return 'Enter your phone number';
      case 3: return 'Link your bank for automatic rent payouts';
      default: return '';
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4 py-12"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_register.png')" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
        </div>

        <StepIndicator currentStep={step} totalSteps={3} />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">{getStepTitle()}</h1>
          <p className="text-text-tertiary mt-1">{getStepSubtitle()}</p>
        </div>

        <div className="clay-card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-clay-sm text-red-600 text-sm">
              {error}
            </div>
          )}
          {step === 1 && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                I want to register as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'agent' }))}
                  className={clsx(
                    'p-4 rounded-clay-sm border-2 transition-all flex flex-col items-center gap-2',
                    !isCompany ? 'border-mustard bg-mustard-pale shadow-clay' : 'border-clay-border hover:border-mustard bg-white'
                  )}
                >
                  <User className="w-6 h-6 text-burnt-brown" />
                  <span className="text-sm font-medium text-text-primary">Agent / Landlord</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'company' }))}
                  className={clsx(
                    'p-4 rounded-clay-sm border-2 transition-all flex flex-col items-center gap-2',
                    isCompany ? 'border-mustard bg-mustard-pale shadow-clay' : 'border-clay-border hover:border-mustard bg-white'
                  )}
                >
                  <Building2 className="w-6 h-6 text-burnt-brown" />
                  <span className="text-sm font-medium text-text-primary">Company</span>
                </button>
              </div>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderBankStep()}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" variant="primary" onClick={handleNext} className="flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmit} className="flex-1" loading={loading} disabled={!acceptedTerms}>
                Complete <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-mustard font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}