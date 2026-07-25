import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { userApi, type KycStatus } from '../../api/user';
import { socketService } from '../../api/socket';

interface DojahKYCSectionProps {
  userRole: string;
  userName?: string;
  userEmail?: string;
  onVerified?: () => void;
}

function loadDojahScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById('dojah-widget-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'dojah-widget-script';
    script.src = 'https://widget.dojah.io/widget.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

export function DojahKYCSection({ userRole, userName, userEmail, onVerified }: DojahKYCSectionProps) {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<'nin' | 'bvn' | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const requiresBvn = ['agent', 'company', 'landlord', 'sub_agent'].includes(userRole);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchKycStatus();
    loadDojahScript();

    const handleKycChange = () => {
      fetchKycStatus();
      onVerified?.();
    };

    socketService.on('kyc_status_changed', handleKycChange);
    return () => {
      socketService.off('kyc_status_changed', handleKycChange);
    };
  }, []);

  const fetchKycStatus = async () => {
    setLoading(true);
    try {
      const res = await userApi.getKycStatus();
      if (res.success && res.data) {
        setKycStatus(res.data);
      }
    } catch {
      // Fall back to profile data
    } finally {
      setLoading(false);
    }
  };

  const openDojahWidget = async (type: 'nin' | 'bvn') => {
    setError('');
    setVerifying(type);

    try {
      if (!(window as any).Connect) {
        setError('Verification service is still loading. Please try again in a few seconds.');
        setVerifying(null);
        return;
      }

      // Call backend to get the proper widgetId and referenceId (mirrors mobile app flow)
      const initRes = await userApi.initializeKyc(type);
      if (!initRes.success || !initRes.data) {
        setError(initRes.error?.message || 'Failed to initialize verification. Please try again.');
        setVerifying(null);
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
            setVerifying(type);
            const refId = response.reference_id || referenceId;

            try {
              await userApi.verifyKyc(refId, type);
            } catch {
              // verify endpoint may still be processing; webhook will handle it
            }

            showToast(`${type.toUpperCase()} verification submitted successfully!`);
            await fetchKycStatus();
            onVerified?.();
          } catch {
            showToast('Failed to submit verification. Please try again.', 'error');
          } finally {
            setVerifying(null);
          }
        },
        onError: (err: any) => {
          console.error('[Dojah]', err);
          showToast('Verification encountered an error. Please try again.', 'error');
          setVerifying(null);
        },
        onClose: () => {
          setVerifying(null);
        },
      };

      const connect = new (window as any).Connect(options);
      connect.setup();
      connect.open();
    } catch {
      showToast('Failed to start verification. Please try again.', 'error');
      setVerifying(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await userApi.syncKyc();
      if (res.success) {
        showToast('Verification status synced successfully!');
        await fetchKycStatus();
        onVerified?.();
      } else {
        showToast(res.error?.message || 'Sync failed. Please try again.', 'error');
      }
    } catch {
      showToast('Failed to sync verification status.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-mustard" />
        <span className="text-sm text-text-tertiary">Loading verification status...</span>
      </div>
    );
  }

  const ninDone = kycStatus?.ninVerified ?? false;
  const bvnDone = kycStatus?.bvnVerified ?? false;
  const isFullyVerified = kycStatus?.verificationStatus === 'verified';
  const bothRequired = requiresBvn;
  const allDone = bothRequired ? (ninDone && bvnDone) : ninDone;

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-clay shadow-clay-lg text-sm font-semibold animate-fade-in ${
          toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="space-y-4">
        {/* NIN Verification */}
        <div className="flex items-center justify-between p-4 rounded-clay-sm bg-clay-border-light">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-clay-sm flex items-center justify-center ${ninDone ? 'bg-status-success/10' : 'bg-mustard-pale'}`}>
              {ninDone ? <CheckCircle className="w-5 h-5 text-status-success" /> : <Shield className="w-5 h-5 text-mustard" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">NIN Verification</p>
              <p className="text-xs text-text-tertiary">
                {ninDone ? 'Verified' : 'National Identification Number'}
                {kycStatus?.ninVerifiedAt && ninDone && (
                  <span className="ml-1">— {new Date(kycStatus.ninVerifiedAt).toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ninDone ? (
              <StatusBadge variant="success">Verified</StatusBadge>
            ) : kycStatus?.verificationStatus === 'pending' ? (
              <StatusBadge variant="warning">Pending</StatusBadge>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => openDojahWidget('nin')}
                loading={verifying === 'nin'}
                disabled={verifying !== null}
              >
                Verify <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* BVN Verification (agents, companies, landlords, sub_agents only) */}
        {bothRequired && (
          <div className="flex items-center justify-between p-4 rounded-clay-sm bg-clay-border-light">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-clay-sm flex items-center justify-center ${bvnDone ? 'bg-status-success/10' : 'bg-mustard-pale'}`}>
                {bvnDone ? <CheckCircle className="w-5 h-5 text-status-success" /> : <Shield className="w-5 h-5 text-mustard" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">BVN Verification</p>
                <p className="text-xs text-text-tertiary">
                  {bvnDone ? 'Verified' : 'Bank Verification Number'}
                  {kycStatus?.bvnVerifiedAt && bvnDone && (
                    <span className="ml-1">— {new Date(kycStatus.bvnVerifiedAt).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bvnDone ? (
                <StatusBadge variant="success">Verified</StatusBadge>
              ) : kycStatus?.verificationStatus === 'pending' ? (
                <StatusBadge variant="warning">Pending</StatusBadge>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openDojahWidget('bvn')}
                  loading={verifying === 'bvn'}
                  disabled={verifying !== null}
                >
                  Verify <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pending Review Banner */}
        {kycStatus?.verificationStatus === 'pending' && !isFullyVerified && (
          <div className="flex items-center gap-3 p-4 rounded-clay-sm bg-amber-50 border border-amber-200">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Verification Pending Review</p>
              <p className="text-xs text-amber-700">
                Your identity verification is currently being processed. You can click sync below to check for updates.
              </p>
            </div>
          </div>
        )}

        {/* Overall status */}
        {allDone && (
          <div className="flex items-center gap-2 p-3 rounded-clay-sm bg-status-success/10 border border-status-success/20">
            <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
            <p className="text-sm font-medium text-status-success">
              {isFullyVerified ? 'Your identity is fully verified' : 'Verification submitted — pending review'}
            </p>
          </div>
        )}

        {/* Sync button for pending states */}
        {!allDone && !verifying && (kycStatus?.verificationStatus === 'pending' || ninDone !== bvnDone) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            loading={syncing}
            disabled={syncing || verifying !== null}
            className="w-full"
          >
            <Clock className="w-4 h-4 mr-2" /> Sync Verification Status
          </Button>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-clay-sm bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>
    </>
  );
}
