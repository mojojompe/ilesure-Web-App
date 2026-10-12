import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../api/authContext';
import { listerRequirementsApi } from '../../api/listerRequirements';
import type { ListerRequirements, ListingAgreementDocument } from '../../api/listerRequirements';
import type { UserRole } from '../../types';

const LISTER_ROLES: UserRole[] = ['landlord', 'agent', 'company', 'company_admin', 'sub_agent'];

/**
 * Tells a lister what stands between them and a published, payable listing: a payout account
 * (rent is paid straight into it by Paystack, so without one their listings cannot be booked)
 * and acceptance of the current Platform Listing Agreement. The server enforces both; this
 * only surfaces them and collects the acceptance. Renders nothing once both are done.
 */
export function ListerRequirementsBanner({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const location = useLocation();
  const isLister = LISTER_ROLES.includes(role);
  const [requirements, setRequirements] = useState<ListerRequirements | null>(null);
  const [agreementOpen, setAgreementOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await listerRequirementsApi.get();
    if (res.success) setRequirements(res.data);
  }, []);

  // Re-read on navigation, so adding a payout account in Settings clears the notice.
  useEffect(() => {
    if (isLister) load();
  }, [isLister, load, location.pathname]);

  if (!isLister || !requirements) return null;
  if (requirements.payoutAccountReady && !requirements.requiresListingAgreement) return null;

  // A sub-agent's rent is paid to their company, whose admin owns the payout account.
  const ownsPayoutAccount = user?.role !== 'sub_agent';
  const settingsPath = role === 'company' || role === 'company_admin' ? '/company/settings' : '/agent/settings';

  return (
    <div className="space-y-3 mb-4">
      {!requirements.payoutAccountReady && (
        <div className="rounded-clay border border-mustard bg-mustard-pale p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-text-primary">Your listings cannot take bookings or payments yet</p>
            <p className="text-sm text-text-secondary mt-0.5">
              {ownsPayoutAccount
                ? 'Add your payout bank account. Rent is paid straight into it by Paystack, so tenants cannot book or pay until it is set up.'
                : 'Your company has not added a payout bank account. Ask your company admin to add one in Settings so tenants can book and pay.'}
            </p>
          </div>
          {ownsPayoutAccount && (
            <Link to={settingsPath}>
              <Button variant="mustard" size="sm">Add payout account</Button>
            </Link>
          )}
        </div>
      )}

      {requirements.requiresListingAgreement && (
        <div className="rounded-clay border border-mustard bg-mustard-pale p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-text-primary">
              {requirements.acceptedVersion ? 'The Platform Listing Agreement has been updated' : 'Accept the Platform Listing Agreement'}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {requirements.acceptedVersion
                ? 'It now covers how you are paid and what happens when a payment is refunded or charged back. Please accept it before publishing your next listing.'
                : 'Please read and accept it before publishing a listing.'}
            </p>
          </div>
          <Button variant="mustard" size="sm" onClick={() => setAgreementOpen(true)}>Review and accept</Button>
        </div>
      )}

      <ListingAgreementModal
        isOpen={agreementOpen}
        accountName={user?.fullName || ''}
        onClose={() => setAgreementOpen(false)}
        onAccepted={(next) => {
          setRequirements(next);
          setAgreementOpen(false);
        }}
      />
    </div>
  );
}

interface ListingAgreementModalProps {
  isOpen: boolean;
  accountName: string;
  onClose: () => void;
  onAccepted: (requirements: ListerRequirements) => void;
}

function ListingAgreementModal({ isOpen, accountName, onClose, onAccepted }: ListingAgreementModalProps) {
  const [document, setDocument] = useState<ListingAgreementDocument | null>(null);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setFullName('');
    listerRequirementsApi.getAgreement().then((res) => {
      if (res.success) setDocument(res.data);
      else setError(res.error.message);
    });
  }, [isOpen]);

  const accept = async () => {
    if (!document) return;
    setSaving(true);
    setError('');
    const res = await listerRequirementsApi.acceptAgreement(fullName, document.version);
    setSaving(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    onAccepted(res.data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={document ? `${document.title} (v${document.version})` : 'Platform Listing Agreement'} size="lg">
      {document ? (
        <>
          <div className="max-h-[45vh] overflow-y-auto rounded-clay border border-clay-border-light bg-white p-4 text-sm text-text-secondary whitespace-pre-wrap">
            {document.body}
          </div>
          <label className="block text-sm font-medium text-text-primary mt-4 mb-1" htmlFor="agreement-full-name">
            Type your full name to accept{accountName ? ` (${accountName})` : ''}
          </label>
          <input
            id="agreement-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={accountName || 'Your full name'}
            autoComplete="off"
            className="w-full rounded-clay border border-clay-border px-3 py-2 text-sm"
          />
        </>
      ) : (
        !error && <p className="text-sm text-text-secondary">Loading the agreement...</p>
      )}
      {error && <p className="text-sm text-red-600 mt-3" role="alert">{error}</p>}
      <div className="flex justify-end gap-3 mt-5">
        <Button variant="secondary" size="sm" onClick={onClose}>Not now</Button>
        <Button variant="mustard" size="sm" onClick={accept} loading={saving} disabled={!document || fullName.trim().length < 2}>
          I accept
        </Button>
      </div>
    </Modal>
  );
}
