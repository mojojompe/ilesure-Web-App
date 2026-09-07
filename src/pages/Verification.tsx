import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, CheckCircle, ArrowRight, Loader2, Shield, X, File, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../api/authContext';
import type { UserRole } from '../types';
import userApi from '../api/user';

interface VerificationProps {
  role: UserRole;
}

interface FileState {
  file: File | null;
  name: string;
  size: string;
  error: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploadZone({
  label,
  required,
  fileState,
  onFile,
  onClear,
  accept,
  id,
}: {
  label: string;
  required?: boolean;
  fileState: FileState;
  onFile: (file: File) => void;
  onClear: () => void;
  accept: string;
  id: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {fileState.file ? (
        <div className="flex items-center gap-3 p-4 bg-status-success/5 border border-status-success/30 rounded-clay-sm">
          <div className="w-10 h-10 rounded-clay-sm bg-status-success/10 flex items-center justify-center flex-shrink-0">
            <File className="w-5 h-5 text-status-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{fileState.name}</p>
            <p className="text-xs text-text-tertiary">{fileState.size}</p>
          </div>
          <button
          /* A11Y-FIX (QA-A11Y-002): icon-only button, announced as just "button". */
          aria-label="Close"
            type="button"
            onClick={onClear}
            className="p-1.5 rounded-full hover:bg-clay-border-light transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-clay-sm p-6 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-mustard bg-mustard-pale'
              : fileState.error
              ? 'border-red-400 bg-red-50'
              : 'border-clay-border hover:border-mustard hover:bg-mustard-pale/40'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary font-medium">
            Drop file here or <span className="text-mustard">click to upload</span>
          </p>
          <p className="text-xs text-text-tertiary mt-1">PDF, JPG, PNG (max 10MB)</p>
        </div>
      )}

      {fileState.error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {fileState.error}
        </p>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function makeFileState(): FileState {
  return { file: null, name: '', size: '', error: '' };
}

export function VerificationPage({ role }: VerificationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Company-specific state
  const [officeAddress, setOfficeAddress] = useState('');
  const [cacFile, setCacFile] = useState<FileState>(makeFileState());
  const [permitFile, setPermitFile] = useState<FileState>(makeFileState());
  const [confirmed, setConfirmed] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // BUGFIX (agent KYC): the portal only ever ran BVN. Track both checks so the screen can show
  // which one is outstanding and run whichever is.
  const [kycRunning, setKycRunning] = useState<'nin' | 'bvn' | null>(null);
  const [ninDone, setNinDone] = useState(!!(user as any)?.ninVerified);
  const [bvnDone, setBvnDone] = useState(!!(user as any)?.bvnVerified);

  const isCompany = role === 'company';
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

  // --- File validation ---
  function validateAndSetFile(
    f: File,
    setter: React.Dispatch<React.SetStateAction<FileState>>
  ) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setter({ file: null, name: '', size: '', error: 'Invalid file type. Use PDF, JPG, or PNG.' });
      return;
    }
    if (f.size > MAX_SIZE) {
      setter({ file: null, name: '', size: '', error: 'File is too large. Max 10MB.' });
      return;
    }
    setter({ file: f, name: f.name, size: formatBytes(f.size), error: '' });
  }

  // --- Company document submit ---
  const handleCompanySubmit = async () => {
    setError('');
    let valid = true;

    if (!cacFile.file) {
      setCacFile(prev => ({ ...prev, error: 'CAC Certificate is required' }));
      valid = false;
    }
    if (!officeAddress.trim()) {
      setError('Please enter your company office address');
      valid = false;
    }
    if (!confirmed || !agreedToTerms) {
      setError('Please confirm all checkboxes before submitting');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('officeAddress', officeAddress.trim());
      formData.append('cacCertificate', cacFile.file!);
      if (permitFile.file) {
        formData.append('businessPermit', permitFile.file);
      }

      const res = await userApi.submitCompanyVerification(formData);
      if (res.success) {
        navigate('/verification/pending');
      } else {
        setError(res.message || 'Failed to submit documents. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => navigate('/agent');

  // ====================================================
  // STEP 1: Document upload / Identity verification
  // ====================================================
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
                {isCompany ? <FileText className="w-8 h-8 text-mustard" /> : <Shield className="w-8 h-8 text-mustard" />}
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                {isCompany ? 'Verify Your Company' : 'Verify Your Identity'}
              </h1>
              <p className="text-text-tertiary mt-2 text-sm">
                {isCompany
                  ? 'Upload your company registration documents for review'
                  : 'We use a secure third-party service to verify your identity'}
              </p>
            </div>

            {/* ─── Company Form ─── */}
            {isCompany ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Office Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="e.g. 14 Lagos Island, Victoria Island, Lagos"
                    className="clay-input w-full"
                  />
                </div>

                <FileUploadZone
                  id="cac-upload"
                  label="CAC Certificate"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  fileState={cacFile}
                  onFile={(f) => validateAndSetFile(f, setCacFile)}
                  onClear={() => setCacFile(makeFileState())}
                />

                <FileUploadZone
                  id="permit-upload"
                  label="Business Permit (Optional)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  fileState={permitFile}
                  onFile={(f) => validateAndSetFile(f, setPermitFile)}
                  onClear={() => setPermitFile(makeFileState())}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-clay-sm p-3 flex gap-2 text-xs text-blue-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Documents are securely stored and only reviewed by iléSure's verification team. Approval usually takes 1–2 business days.
                  </span>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-clay-sm p-3 flex gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => {
                    // Quick front-end validation before going to step 2
                    if (!cacFile.file) {
                      setCacFile(prev => ({ ...prev, error: 'CAC Certificate is required' }));
                      return;
                    }
                    if (!officeAddress.trim()) {
                      setError('Please enter your company office address');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  variant="primary"
                  className="w-full"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button onClick={handleSkip} variant="secondary" className="w-full">
                  Skip for now
                </Button>
              </div>
            ) : (
              /* ─── Individual / Agent: Dojah Widget ───
                 BUGFIX (agent KYC): this ran initializeKyc('bvn') and nothing else, while the
                 backend refuses listing creation unless an agent or landlord has BOTH
                 ninVerified and bvnVerified (listingController). An agent who verified here got
                 BVN only and then met 403 VERIFICATION_REQUIRED on every attempt to publish,
                 with nothing on this screen offering the step they were missing — the portal
                 could not satisfy its own prerequisite. Both checks are offered, each showing
                 whether it is already done. */
              <div className="space-y-4">
                <div className="space-y-3 py-2">
                  {([
                    { type: 'nin' as const, label: 'NIN', done: ninDone },
                    { type: 'bvn' as const, label: 'BVN', done: bvnDone },
                  ]).map(({ type, label, done }) => (
                    <div key={type} className="flex items-center justify-between gap-3 rounded-clay-sm border border-clay-border p-3">
                      <div>
                        <p className="text-sm font-bold text-text-primary">{label} verification</p>
                        <p className="text-xs text-text-tertiary">
                          {done ? 'Verified' : 'Required before you can publish listings'}
                        </p>
                      </div>
                      {done ? (
                        <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />
                      ) : (
                        <Button
                          onClick={() => runKycCheck(type)}
                          variant="primary"
                          loading={kycRunning === type}
                          disabled={!!kycRunning}
                        >
                          Verify {label}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {ninDone && bvnDone && (
                  <p className="text-center text-xs text-status-success font-semibold">
                    Both checks complete — you can publish listings.
                  </p>
                )}

                <Button onClick={handleSkip} variant="secondary" className="w-full">
                  Skip for now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Run one Dojah check. Parameterised by type because the portal needs both: the backend gate
   * for agents and landlords is ninVerified AND bvnVerified, so verifying only one leaves the
   * account permanently unable to list.
   */
  const runKycCheck = async (type: 'nin' | 'bvn') => {
    if (!(window as any).Connect) {
      alert('Verification service is still loading. Please try again in a few seconds.');
      return;
    }

    setKycRunning(type);
    try {
      const initRes = await userApi.initializeKyc(type);
      if (!initRes.success || !initRes.data) {
        alert(initRes.error?.message || 'Failed to initialize verification. Please try again.');
        setKycRunning(null);
        return;
      }

      const { widgetId, referenceId } = initRes.data;

      const options = {
        app_id: import.meta.env.VITE_DOJAH_APP_ID,
        p_key: import.meta.env.VITE_DOJAH_PUBLIC_KEY,
        type: 'custom',
        reference_id: referenceId,
        config: { widget_id: widgetId },
        onSuccess: async (response: any) => {
          try {
            await userApi.verifyKyc(response.reference_id || referenceId, type);
            if (type === 'nin') setNinDone(true);
            else setBvnDone(true);
          } catch {
            alert('Failed to submit verification. Please try again.');
          } finally {
            setKycRunning(null);
          }
        },
        onError: (err: any) => { console.error('[Dojah]', err); setKycRunning(null); },
        onClose: () => setKycRunning(null),
      };

      const connect = new (window as any).Connect(options);
      connect.setup();
      connect.open();
    } catch {
      alert('Failed to start verification. Please try again.');
      setKycRunning(null);
    }
  };

  // ====================================================
  // STEP 2: Review & Submit
  // ====================================================
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
              {isCompany ? 'Confirm Submission' : 'Review Your Information'}
            </h1>
            <p className="text-text-tertiary mt-2 text-sm">
              {isCompany ? 'Please confirm your details before submitting' : 'Please review the information you provided'}
            </p>
          </div>

          <div className="bg-mustard-pale rounded-clay-sm p-4 mb-5">
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
              {isCompany && (
                <>
                  {currentUser?.company && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Company:</span>
                      <span className="font-medium">{currentUser.company.name}</span>
                    </div>
                  )}
                  {officeAddress && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Office Address:</span>
                      <span className="font-medium text-right max-w-[60%]">{officeAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">CAC Certificate:</span>
                    <span className="font-medium text-status-success">{cacFile.name || '—'}</span>
                  </div>
                  {permitFile.file && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Business Permit:</span>
                      <span className="font-medium text-status-success">{permitFile.name}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-clay-border accent-mustard mt-0.5 flex-shrink-0"
              />
              <span className="text-sm text-text-secondary">
                I confirm that the information and documents provided are true and accurate
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 rounded border-clay-border accent-mustard mt-0.5 flex-shrink-0"
              />
              <span className="text-sm text-text-secondary">
                I agree to iléSure's{' '}
                <a href="#" className="text-mustard underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-mustard underline">Privacy Policy</a>
              </span>
            </label>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-clay-sm p-3 flex gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <Button
            onClick={isCompany ? handleCompanySubmit : () => navigate('/verification/pending')}
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading documents...</>
            ) : (
              'Submit for Verification'
            )}
          </Button>

          <Button
            onClick={() => setStep(1)}
            variant="secondary"
            className="w-full mt-3"
            disabled={loading}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}