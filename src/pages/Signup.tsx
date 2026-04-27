import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, Upload, Camera, Building2, GraduationCap, Briefcase, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import type { UserRole, SignupData } from '../types';

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
  const [step, setStep] = useState(1);
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

  const [documents, setDocuments] = useState({
    idCard: '',
    nin: '',
    propertyProof: '',
    utilityBill: '',
    liveSelfie: '',
    cacCertificate: '',
  });

  const [isCompany, setIsCompany] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDocumentChange = (field: string, value: string) => {
    setDocuments(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) return;
      if (formData.password !== formData.confirmPassword) return;
    }
    if (step === 2) {
      if (!formData.phone) return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate(isCompany ? '/verification/company' : '/verification/agent');
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
        <p className="text-xs text-text-tertiary mt-1">We'll send a verification code to this number</p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {!isCompany ? (
        <>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Upload ID Card
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Click to upload or drag and drop</p>
              <p className="text-xs text-text-tertiary mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Upload NIN
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">National ID Number Document</p>
              <p className="text-xs text-text-tertiary mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Property Proof (Utility Bill)
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Proof of property ownership</p>
              <p className="text-xs text-text-tertiary mt-1">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Utility Bill
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Recent utility bill</p>
              <p className="text-xs text-text-tertiary mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Live Selfie
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Camera className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Take a live selfie</p>
              <p className="text-xs text-text-tertiary mt-1">Required for verification</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              CAC Certificate
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Corporate Affairs Commission Certificate</p>
              <p className="text-xs text-text-tertiary mt-1">PDF up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Director ID Card
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Director's valid ID</p>
              <p className="text-xs text-text-tertiary mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Business Permit
            </label>
            <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center hover:border-mustard transition-colors cursor-pointer bg-clay-border-light">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Local government business permit</p>
              <p className="text-xs text-text-tertiary mt-1">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Create Account';
      case 2: return 'Phone Number';
      case 3: return 'Verification Documents';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Enter your basic information';
      case 2: return 'Enter your phone number';
      case 3: return 'Upload required documents';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
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
          {step === 1 && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                I want to register as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setIsCompany(false); setFormData(prev => ({ ...prev, role: 'agent' })); }}
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
                  onClick={() => { setIsCompany(true); setFormData(prev => ({ ...prev, role: 'company' })); }}
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
          {step === 3 && renderStep3()}

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
              <Button type="button" variant="primary" onClick={handleSubmit} className="flex-1" loading={loading}>
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