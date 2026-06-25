import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, CheckCircle, ArrowRight, Loader2, XCircle, Clock, Shield } from 'lucide-react';
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

  useEffect(() => {
    if (!isCompany && !document.getElementById('dojah-script')) {
      const script = document.createElement('script');
      script.id = 'dojah-script';
      script.src = 'https://widget.dojah.io/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isCompany]);

  if (step === 1) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4"
        style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_kyc.png')" }}
      >
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
                <div className="text-center py-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-mustard-pale rounded-full flex items-center justify-center">
                    <Shield className="w-10 h-10 text-mustard" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Identity Verification</h3>
                  <p className="text-sm text-text-secondary mb-6">
                    We use a secure third-party service to verify your identity. You will need your BVN or NIN.
                  </p>
                  <Button
                    onClick={() => {
                      const appId = import.meta.env.VITE_DOJAH_APP_ID;
                      const pKey = import.meta.env.VITE_DOJAH_PUBLIC_KEY;

                      if (!appId || !pKey || appId.includes('your_')) {
                        alert("Verification service is not configured correctly. Please configure VITE_DOJAH_APP_ID and VITE_DOJAH_PUBLIC_KEY in your .env file.");
                        return;
                      }

                      if (!(window as any).Connect) {
                        alert("Verification service is still loading. Please try again in a few seconds.");
                        return;
                      }

                      const options = {
                        app_id: appId,
                        p_key: pKey,
                        type: 'custom',
                        config: {
                          pages: [
                            { page: 'bvn' }
                          ]
                        },
                        onSuccess: async (response: any) => {
                          try {
                            setLoading(true);
                            await userApi.submitKycReference(response.reference_id || 'dojah_success');
                            setStep(2);
                          } catch (err) {
                            alert("Failed to submit verification");
                          } finally {
                            setLoading(false);
                          }
                        },
                        onError: (err: any) => {
                          console.error(err);
                        },
                        onClose: () => {
                          // Modal closed
                        }
                      };

                      const connect = new (window as any).Connect(options);
                      connect.setup();
                      connect.open();
                    }}
                    variant="primary"
                    className="w-full"
                    loading={loading}
                  >
                    Start Verification
                  </Button>
                </div>
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
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_kyc.png')" }}
    >
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