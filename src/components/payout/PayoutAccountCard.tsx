import { useEffect, useState } from 'react';
import { Money01Icon, CheckmarkBadge02Icon, Alert01Icon } from '@hugeicons/react';
import { ClayCard } from '../ui/ClayCard';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ownerApi, type OwnerRole, type SubaccountInfo } from '../../api/owner';
import { paymentsApi, type Bank } from '../../api/payments';
import { getApiErrorMessage } from '../../api/apiError';
import { canSave, canVerify, cleanAccountNumber, formatChangedAt, payoutFailureMessage } from '../../lib/payoutAccount';

interface PayoutAccountCardProps {
  role: OwnerRole;
  title: string;
  /** Shown above the form when no account is set up yet. */
  intro: string;
  /** Shown under the active account. */
  activeNote: string;
  businessLabel: string;
  businessPlaceholder: string;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

/**
 * The payout (bank) account card on the agent and company Settings pages: shows the active
 * account with "Change bank account" and "Remove", or the setup form. Setting up and changing
 * use the same form and the same call; the server resolves the holder with Paystack and
 * refuses an account whose name does not match (NAME_MISMATCH), shown here verbatim.
 */
export function PayoutAccountCard({ role, title, intro, activeNote, businessLabel, businessPlaceholder, onToast }: PayoutAccountCardProps) {
  const api = ownerApi(role);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [account, setAccount] = useState<SubaccountInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ businessName: '', bankCode: '', accountNumber: '' });
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    paymentsApi.listBanks().then(setBanks);
    api.getSubaccount().then((res) => {
      if (res.success && res.data) setAccount(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const active = Boolean(account?.subaccountCode);
  const bankLabel = (code?: string | null, name?: string | null) => name || banks.find((b) => b.code === code)?.name || code || '';

  const startChange = () => {
    setForm({ businessName: '', bankCode: '', accountNumber: '' });
    setResolvedName('');
    setFormError('');
    setEditing(true);
  };

  const updateForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    if (patch.bankCode !== undefined || patch.accountNumber !== undefined) setResolvedName('');
    setFormError('');
  };

  const handleVerify = async () => {
    if (!canVerify(form)) return;
    setResolving(true);
    setFormError('');
    try {
      const result = await paymentsApi.resolveAccount(form.accountNumber, form.bankCode);
      setResolvedName(result.accountName || '');
    } catch (err) {
      setResolvedName('');
      setFormError(getApiErrorMessage(err, 'We could not verify that account. Check the number and bank.'));
    } finally {
      setResolving(false);
    }
  };

  const handleSave = async () => {
    if (!canSave(form, resolvedName, account)) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await api.setupSubaccount({
        ...(form.businessName.trim() ? { businessName: form.businessName.trim() } : {}),
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
        bankName: banks.find((b) => b.code === form.bankCode)?.name,
      });
      if (res.success) {
        const wasActive = active;
        setAccount(res.data || null);
        setEditing(false);
        onToast(wasActive ? 'Payout account changed.' : 'Payout account saved.');
      } else {
        setFormError(payoutFailureMessage(res.error, 'Failed to save the payout account'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setRemoveError('');
    try {
      const res = await api.removeSubaccount();
      if (res.success) {
        setAccount(null);
        setConfirmRemove(false);
        onToast('Payout account removed.');
      } else {
        setRemoveError(payoutFailureMessage(res.error, 'Failed to remove the payout account'));
      }
    } finally {
      setRemoving(false);
    }
  };

  const changedAt = formatChangedAt(account?.changedAt);
  const showForm = !active || editing;

  return (
    <ClayCard className="p-5">
      <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
        <Money01Icon className="w-5 h-5 text-mustard" />
        {title}
      </h2>

      {active && account && (
        <div className="space-y-3 p-4 rounded-clay-sm bg-status-success/10">
          <div className="flex items-center gap-2 text-status-success font-medium">
            <CheckmarkBadge02Icon className="w-5 h-5" />
            Payout Account Active
          </div>
          <div className="text-sm text-text-secondary space-y-1">
            <p><span className="font-medium">Bank Name:</span> {bankLabel(account.bankCode, account.bankName)}</p>
            <p><span className="font-medium">Account Number:</span> {account.accountNumber}</p>
            <p><span className="font-medium">Account Name:</span> {account.accountName}</p>
            {changedAt && <p className="text-xs text-text-tertiary">Last updated {changedAt}</p>}
            <p className="text-xs text-text-tertiary mt-2">{activeNote}</p>
          </div>
          {!editing && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={startChange}>Change bank account</Button>
              <Button variant="danger" size="sm" onClick={() => { setRemoveError(''); setConfirmRemove(true); }}>Remove</Button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className={active ? 'space-y-4 mt-4' : 'space-y-4'}>
          <p className="text-sm text-text-tertiary">
            {active ? 'Enter the new account. The account name must match your verified name.' : intro}
          </p>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              {businessLabel} <span className="normal-case font-normal text-text-tertiary">(optional)</span>
            </label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => updateForm({ businessName: e.target.value })}
              className="clay-input w-full"
              placeholder={businessPlaceholder}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Bank</label>
            <select value={form.bankCode} onChange={(e) => updateForm({ bankCode: e.target.value })} className="clay-input w-full">
              <option value="">Select a bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Account Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                name="nuban-account-number"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                value={form.accountNumber}
                onChange={(e) => updateForm({ accountNumber: cleanAccountNumber(e.target.value) })}
                className="clay-input flex-1"
                placeholder="0123456789"
                maxLength={10}
              />
              <Button variant="secondary" size="sm" onClick={handleVerify} loading={resolving} disabled={!canVerify(form)}>
                Verify
              </Button>
            </div>
          </div>
          {resolvedName && (
            <div className="p-3 rounded-clay-sm bg-status-success/10 border border-status-success/20">
              <p className="text-sm font-medium text-status-success">Account verified</p>
              <p className="text-sm text-text-primary font-semibold">{resolvedName}</p>
            </div>
          )}
          {formError && (
            <div className="flex items-start gap-2 p-3 text-sm rounded-clay-sm bg-status-danger/10 text-status-danger border border-status-danger/20">
              <Alert01Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex gap-2">
            {active && (
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving} disabled={!canSave(form, resolvedName, account)}>
              <Money01Icon className="w-4 h-4 mr-2" /> {active ? 'Save New Account' : 'Save Bank Account'}
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={confirmRemove} onClose={() => !removing && setConfirmRemove(false)} title="Remove payout account?" size="sm">
        <p className="text-sm text-text-secondary mb-4">
          Rent for your listings will not be paid out until you add a new account. You can only remove it when no
          live listings, open bookings or unsettled payments rely on it.
        </p>
        {removeError && (
          <div className="flex items-start gap-2 p-3 mb-4 text-sm rounded-clay-sm bg-status-danger/10 text-status-danger border border-status-danger/20">
            <Alert01Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{removeError}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmRemove(false)} disabled={removing}>Keep account</Button>
          <Button variant="danger" className="flex-1" onClick={handleRemove} loading={removing}>Remove</Button>
        </div>
      </Modal>
    </ClayCard>
  );
}

export default PayoutAccountCard;
