import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, CheckCircle, ArrowRight, Loader2, XCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../api/authContext';
import type { UserRole } from '../types';
import userApi from '../api/user';

interface VerificationProps {
  role: UserRole;
}

export function VerificationPage({ role }: VerificationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [idType, setIdType] = useState<'nin' | 'drivers_license' | 'passport' | 'voters_card'>('nin');
  const [skipping, setSkipping] = useState(false);
  
  const isCompany = role === 'company';

  const idTypes = [
    { value: 'nin', label: 'NIN' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'passport', label: 'International Passport' },
    { value: 'voters_card', label: "Voter's Card" },
  ] as const;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // TODO: Implement verification flow with file upload
      navigate('/verification/pending');
    } catch (error: any) {
      console.error('Verification submit error:', error);
      alert(error.response?.data?.error?.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSkipping(true);
    navigate('/agent');
  };

  const currentUser = user;

  if (step === 1) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="clay-card p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-mustard-pale flex items-center justify-center">
                <FileText className="w-8 h-8 text-mustard" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                {isCompany ? 'Verify Your Company' : 'Verify Your Identity'}
              </h1>
              <p className="text-text-tertiary mt-2">
                {isCompany
                  ? 'Submit your company documents for verification'
                  : 'We need to verify your identity to get you started'}
              </p>
            </div>

            <div className="space-y-4">
              {isCompany ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Company Address
                    </label>
                    <input
                      type="text"
                      placeholder="Your registered company address"
                      className="clay-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      CAC Certificate
                    </label>
                    <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center cursor-pointer hover:border-mustard transition-colors">
                      <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Drop CAC certificate here or click to upload
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Business Permit
                    </label>
                    <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center cursor-pointer hover:border-mustard transition-colors">
                      <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Drop business permit here or click to upload
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      ID Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {idTypes.map(type => (
                        <button
                          key={type.value}
                          onClick={() => setIdType(type.value)}
                          className={`p-3 rounded-clay-sm border-2 text-sm font-medium transition-all ${
                            idType === type.value
                              ? 'border-mustard bg-mustard-pale text-text-primary'
                              : 'border-clay-border text-text-secondary hover:border-mustard/50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      ID Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your ID number"
                      className="clay-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Upload ID Card
                    </label>
                    <div className="border-2 border-dashed border-clay-border rounded-clay-sm p-6 text-center cursor-pointer hover:border-mustard transition-colors">
                      <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Drop ID card image here or click to upload
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">JPG, PNG (max 5MB)</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={() => setStep(2)}
              variant="primary"
              className="w-full mt-6"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              onClick={handleSkip}
              variant="secondary"
              className="w-full mt-3"
              disabled={skipping}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="clay-card p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-mustard-pale flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-mustard" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              Review Your Information
            </h1>
            <p className="text-text-tertiary mt-2">
              Please review the information you provided
            </p>
          </div>

          <div className="bg-mustard-pale rounded-clay-sm p-4 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Name:</span>
                <span className="font-medium">{currentUser?.fullName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Email:</span>
                <span className="font-medium">{currentUser?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Phone:</span>
                <span className="font-medium">{currentUser?.phone || 'N/A'}</span>
              </div>
              {isCompany && currentUser?.company && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Company:</span>
                    <span className="font-medium">{currentUser.company.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-clay-border accent-mustard mt-0.5" />
              <span className="text-sm text-text-secondary">
                I confirm that the information provided is true and accurate
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-clay-border accent-mustard mt-0.5" />
              <span className="text-sm text-text-secondary">
                I agree to iléSure's{' '}
                <a href="#" className="text-mustard underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-mustard underline">Privacy Policy</a>
              </span>
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            variant="primary"
            className="w-full mt-6"
            loading={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'}
          </Button>
        </div>
      </div>
    </div>
  );
}