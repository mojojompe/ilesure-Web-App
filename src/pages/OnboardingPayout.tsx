import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight01Icon, CheckmarkBadge02Icon, Alert01Icon } from '@hugeicons/react';
import { Button } from '../components/ui/Button';
import { PayoutAccountCard } from '../components/payout/PayoutAccountCard';
import { useAuth } from '../api/authContext';

/**
 * Onboarding step after email verification: add the bank account rent is paid out to.
 *
 * This used to be the last step of the signup form, before the account existed, and was saved
 * in the same click that created the account, with a failure only surfacing as a line on the
 * OTP screen. Now the account exists (and its email is verified) first, so the payout account
 * is created against that user through the same card Settings uses, and any refusal (e.g. a
 * name mismatch) is shown right here where it can be fixed. Skippable: it can be added later
 * from Settings.
 */
export function OnboardingPayoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasAccount, setHasAccount] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!user) return <Navigate to="/login" replace />;

  const isCompany = user.role === 'company' || user.role === 'company_admin';
  const next = isCompany ? '/verification/company' : '/verification/agent';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4 py-12">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-clay shadow-clay-lg text-sm font-semibold ${toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'}`}>
          {toast.type === 'success' ? <CheckmarkBadge02Icon className="w-4 h-4" /> : <Alert01Icon className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Add your bank account</h1>
          <p className="text-text-tertiary mt-1 text-sm">Where rent payments from your listings are paid out</p>
        </div>

        {isCompany ? (
          <PayoutAccountCard
            role="company"
            title="Company Bank Account"
            intro="Rent payments are split automatically: the iléSure service fee to us, the balance to this account. The account name must match your company's registered or trading name, or your own verified name."
            activeNote="Rent payments will be settled automatically to this account."
            businessLabel="Business Name"
            businessPlaceholder="e.g. ABC Properties Ltd"
            onToast={showToast}
            onAccountChange={setHasAccount}
          />
        ) : (
          <PayoutAccountCard
            role="agent"
            title="Bank Account for Payments"
            intro="Rent payments are settled automatically to this account. The account name must match your name."
            activeNote="Rent payments will be settled automatically to your account."
            businessLabel="Business / Agency Name"
            businessPlaceholder="e.g. ABC Properties"
            onToast={showToast}
            onAccountChange={setHasAccount}
          />
        )}

        <div className="mt-6 space-y-2">
          <Button variant={hasAccount ? 'primary' : 'secondary'} className="w-full" onClick={() => navigate(next, { replace: true })}>
            {hasAccount ? 'Continue' : 'Skip for now'} <ArrowRight01Icon className="w-4 h-4 ml-2" />
          </Button>
          {!hasAccount && (
            <p className="text-center text-xs text-text-tertiary">You can add it later from Settings. You'll need it before renters can pay for your listings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
