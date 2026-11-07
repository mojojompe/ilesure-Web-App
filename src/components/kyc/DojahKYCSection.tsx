import { useState, useEffect } from 'react';
import { SecurityIcon, CheckmarkBadge02Icon, Clock02Icon, Loading02Icon, Alert01Icon, ArrowRight01Icon } from '@hugeicons/react';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { userApi, type KycStatus, type KycCheck } from '../../api/user';
import { socketService } from '../../api/socket';
import { useKycResultWatcher } from '../../hooks/useKycResultWatcher';
import { openDojahModal, closeDojahModal } from '../../lib/dojahModal';

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
  const [verifying, setVerifying] = useState<KycCheck | null>(null);
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

  /** @param quiet refresh in place, without swapping the section for the loading spinner. */
  const fetchKycStatus = async (quiet = false) => {
    if (!quiet) setLoading(true);
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

  const openDojahWidget = async (type: KycCheck) => {
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
      // The server now holds this check's reference, so /kyc/status reports it as started and
      // the result watcher below starts looking for it (needed when it is finished on a phone).
      fetchKycStatus(true);

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

            // The company check has an answer worth showing: when CAC's record does not match
            // the company on the account, the server says exactly what differs.
            if (type === 'cac') {
              const res = await userApi.verifyKyc(refId, 'cac');
              if (res.success) {
                showToast(res.data?.companyVerified ? 'Your company is verified!' : 'Company (CAC) check passed.');
              } else {
                setError(res.error?.message || 'Company verification could not be completed. Please try again.');
              }
              await fetchKycStatus();
              onVerified?.();
              return;
            }

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
          // The widget also routes messages it does not recognise here (e.g. from the success
          // screen after finishing on a phone), so check for a result before calling it a failure.
          console.error('[Dojah]', err);
          setVerifying(null);
          userApi.syncKyc().then(async (res) => {
            await fetchKycStatus(true);
            if (!(res.success && (res.data?.ninVerified || res.data?.bvnVerified || res.data?.cacVerified))) {
              showToast('Verification window closed. If you finished it, the result will show here shortly.', 'error');
            }
          }).catch(() => {});
        },
        onClose: () => {
          setVerifying(null);
          // Closed after finishing on a phone, or partway: either way, look for a result now.
          userApi.syncKyc().then(() => fetchKycStatus(true)).catch(() => {});
        },
      };

      openDojahModal(options);
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
      if (res.success && res.data) {
        await fetchKycStatus();
        onVerified?.();

        const results = res.data.results || {};
        const ninResult = results.nin;
        const bvnResult = results.bvn;

        if (res.data.ninVerified || res.data.bvnVerified) {
          showToast('Verification status updated successfully!');
        } else if (ninResult?.reason?.includes('Still processing')) {
          showToast('NIN verification is still processing with Dojah. Please wait a few moments.');
        } else if (bvnResult?.reason?.includes('No reference ID found')) {
          showToast('NIN checked. Please click "Verify" next to BVN to complete verification.');
        } else {
          showToast('Verification status synced.');
        }
      } else {
        showToast(res.error?.message || 'Sync failed. Please try again.', 'error');
      }
    } catch {
      showToast('Failed to sync verification status.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // A check opened in Dojah with no result recorded yet (e.g. continued on a phone).
  const p = kycStatus?.pendingSync;
  const watching = Boolean(
    kycStatus && kycStatus.verificationStatus !== 'verified' && p &&
    ((p.nin && !kycStatus.ninVerified) || (p.bvn && requiresBvn && !kycStatus.bvnVerified) || (p.cac && kycStatus.cacRequired && !kycStatus.cacVerified))
  );
  useKycResultWatcher(watching, (result) => {
    const before = kycStatus;
    const newlyDone = (result.ninVerified && !before?.ninVerified) || (result.bvnVerified && !before?.bvnVerified) || (result.cacVerified && !before?.cacVerified);
    if (newlyDone) {
      closeDojahModal();
      showToast('Verification received from Dojah.');
      onVerified?.();
    }
    fetchKycStatus(true);
  });

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Loading02Icon className="w-5 h-5 animate-spin text-mustard" />
        <span className="text-sm text-text-tertiary">Loading verification status...</span>
      </div>
    );
  }

  const ninDone = kycStatus?.ninVerified ?? false;
  const bvnDone = kycStatus?.bvnVerified ?? false;
  const isFullyVerified = kycStatus?.verificationStatus === 'verified';
  const bothRequired = requiresBvn;
  // The company's own check, shown to whoever runs a company (the server decides who).
  const cacRequired = kycStatus?.cacRequired ?? false;
  const cacDone = kycStatus?.cacVerified ?? false;
  const cacRefused = !cacDone && Boolean(kycStatus?.cacCheckStatus) && kycStatus?.cacCheckStatus !== 'passed';
  const identityDone = bothRequired ? (ninDone && bvnDone) : ninDone;
  const allDone = identityDone && (!cacRequired || cacDone);
  // `verificationStatus` is 'pending' from the moment an account exists, so it says nothing
  // about whether a check was ever started. Keying the badges on it showed a brand-new agent
  // "Pending" in place of the Verify buttons, with no way to begin. `pendingSync` is the real
  // signal: a check was opened in Dojah and its result is not recorded yet.
  const ninStarted = !ninDone && Boolean(kycStatus?.pendingSync?.nin);
  const bvnStarted = !bvnDone && Boolean(kycStatus?.pendingSync?.bvn);
  const cacStarted = cacRequired && !cacDone && Boolean(kycStatus?.pendingSync?.cac);
  const anyStarted = ninStarted || (bothRequired && bvnStarted) || cacStarted;

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-clay shadow-clay-lg text-sm font-semibold animate-fade-in ${toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
          }`}>
          {toast.type === 'success' ? <CheckmarkBadge02Icon className="w-4 h-4" /> : <Alert01Icon className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="space-y-4">
        {/* NIN Verification */}
        <div className="flex items-center justify-between p-4 rounded-clay-sm bg-clay-border-light">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-clay-sm flex items-center justify-center ${ninDone ? 'bg-status-success/10' : 'bg-mustard-pale'}`}>
              {ninDone ? <CheckmarkBadge02Icon className="w-5 h-5 text-status-success" /> : <SecurityIcon className="w-5 h-5 text-mustard" />}
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
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => openDojahWidget('nin')}
                loading={verifying === 'nin'}
                disabled={verifying !== null}
              >
                {ninStarted ? 'Try again' : 'Verify'} <ArrowRight01Icon className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* BVN Verification (agents, companies, landlords, sub_agents only) */}
        {bothRequired && (
          <div className="flex items-center justify-between p-4 rounded-clay-sm bg-clay-border-light">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-clay-sm flex items-center justify-center ${bvnDone ? 'bg-status-success/10' : 'bg-mustard-pale'}`}>
                {bvnDone ? <CheckmarkBadge02Icon className="w-5 h-5 text-status-success" /> : <SecurityIcon className="w-5 h-5 text-mustard" />}
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
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openDojahWidget('bvn')}
                  loading={verifying === 'bvn'}
                  disabled={verifying !== null}
                >
                  {bvnStarted ? 'Try again' : 'Verify'} <ArrowRight01Icon className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Company (CAC) verification: company owners and admins only */}
        {cacRequired && (
          <div className="flex items-center justify-between p-4 rounded-clay-sm bg-clay-border-light">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-clay-sm flex items-center justify-center ${cacDone ? 'bg-status-success/10' : 'bg-mustard-pale'}`}>
                {cacDone ? <CheckmarkBadge02Icon className="w-5 h-5 text-status-success" /> : <SecurityIcon className="w-5 h-5 text-mustard" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Company (CAC) Verification</p>
                <p className="text-xs text-text-tertiary">
                  {cacDone
                    ? `Verified${kycStatus?.cacRegisteredName ? ` as ${kycStatus.cacRegisteredName}` : ''}`
                    : cacRefused
                      ? 'Your company details did not match CAC. Check your company name and RC number, then try again.'
                      : 'Confirms your company with the Corporate Affairs Commission'}
                  {kycStatus?.cacVerifiedAt && cacDone && (
                    <span className="ml-1">— {new Date(kycStatus.cacVerifiedAt).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cacDone ? (
                <StatusBadge variant="success">Verified</StatusBadge>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openDojahWidget('cac')}
                  loading={verifying === 'cac'}
                  disabled={verifying !== null}
                >
                  {cacRefused ? 'Try again' : 'Verify'} <ArrowRight01Icon className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pending Review Banner */}
        {anyStarted && !allDone && (
          <div className="flex items-center gap-3 p-4 rounded-clay-sm bg-amber-50 border border-amber-200">
            <Clock02Icon className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Waiting for a result</p>
              <p className="text-xs text-amber-700">
                You started a check but we haven't received the result yet. If you finished it in the Dojah window, tap Sync below. Otherwise, tap Try again.
              </p>
            </div>
          </div>
        )}

        {/* Overall status */}
        {allDone && (
          <div className="flex items-center gap-2 p-3 rounded-clay-sm bg-status-success/10 border border-status-success/20">
            <CheckmarkBadge02Icon className="w-4 h-4 text-status-success flex-shrink-0" />
            <p className="text-sm font-medium text-status-success">
              {cacRequired
                ? (kycStatus?.companyStatus === 'verified' ? 'Your company is fully verified' : 'All checks passed')
                : isFullyVerified ? 'Your identity is fully verified' : 'Verification submitted, pending review'}
            </p>
          </div>
        )}

        {/* Sync button for pending states */}
        {!allDone && !verifying && anyStarted && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            loading={syncing}
            disabled={syncing || verifying !== null}
            className="w-full"
          >
            <Clock02Icon className="w-4 h-4 mr-2" /> Sync Verification Status
          </Button>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-clay-sm bg-red-50 border border-red-200">
            <Alert01Icon className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>
    </>
  );
}
