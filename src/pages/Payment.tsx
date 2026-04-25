import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Building, Smartphone, Lock, Check, Loader } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { tiers, companyTiers } from '../data/mockData';

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'ussd'>('card');
  const [success, setSuccess] = useState(false);

  const tierId = searchParams.get('tier') || 'premium';
  const billing = searchParams.get('billing') || 'monthly';

  const allTiers = [...tiers, ...companyTiers];
  const tier = allTiers.find(t => t.id === tierId) || tiers[2];
  const price = billing === 'annually' && tier.price > 0
    ? Math.round(tier.price * 12 * 0.8)
    : tier.price;

  const handlePayment = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="clay-card p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-status-success/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-status-success" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Payment Successful!
            </h1>
            <p className="text-text-tertiary mb-6">
              You are now on the {tier.name} plan
            </p>
            <Button
              onClick={() => navigate('/agent')}
              variant="primary"
              className="w-full"
            >
              Go to Dashboard
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
          <h1 className="text-2xl font-bold text-text-primary mb-6">Complete Payment</h1>

          <div className="bg-mustard-pale rounded-clay-sm p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-text-primary">{tier.name} Plan</p>
                <p className="text-sm text-text-tertiary">{billing}</p>
              </div>
              <p className="text-xl font-bold text-text-primary">
                ₦{price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Payment Method
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod('card')}
                className={clsx(
                  'w-full p-4 rounded-clay-sm border-2 flex items-center gap-3 transition-all',
                  paymentMethod === 'card'
                    ? 'border-mustard bg-mustard-pale'
                    : 'border-clay-border hover:border-mustard/50'
                )}
              >
                <CreditCard className="w-5 h-5 text-burnt-brown" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">Debit/Credit Card</p>
                  <p className="text-xs text-text-tertiary">Pay with Visa, Mastercard</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('bank')}
                className={clsx(
                  'w-full p-4 rounded-clay-sm border-2 flex items-center gap-3 transition-all',
                  paymentMethod === 'bank'
                    ? 'border-mustard bg-mustard-pale'
                    : 'border-clay-border hover:border-mustard/50'
                )}
              >
                <Building className="w-5 h-5 text-burnt-brown" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">Bank Transfer</p>
                  <p className="text-xs text-text-tertiary">Transfer to our bank account</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('ussd')}
                className={clsx(
                  'w-full p-4 rounded-clay-sm border-2 flex items-center gap-3 transition-all',
                  paymentMethod === 'ussd'
                    ? 'border-mustard bg-mustard-pale'
                    : 'border-clay-border hover:border-mustard/50'
                )}
              >
                <Smartphone className="w-5 h-5 text-burnt-brown" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">USSD</p>
                  <p className="text-xs text-text-tertiary">*900# for GTBank users</p>
                </div>
              </button>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="clay-input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="clay-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="clay-input w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div className="bg-burnt-brown-pale rounded-clay-sm p-4 mb-6">
              <p className="text-sm font-medium text-text-primary mb-2">Bank Details</p>
              <div className="space-y-1 text-sm text-text-secondary">
                <p>Bank: GTBank</p>
                <p>Account Name: iléSure Properties Ltd</p>
                <p>Account Number: 0123456789</p>
              </div>
            </div>
          )}

          {paymentMethod === 'ussd' && (
            <div className="bg-burnt-brown-pale rounded-clay-sm p-4 mb-6">
              <p className="text-sm font-medium text-text-primary mb-2">USSD Code</p>
              <p className="text-sm text-text-secondary">
                Dial <span className="font-bold">*900*500*Amount#</span> on your GTBank account
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-text-tertiary mb-6">
            <Lock className="w-4 h-4" />
            <span>Your payment is secured with SSL encryption</span>
          </div>

          <Button
            onClick={handlePayment}
            variant="primary"
            className="w-full"
            loading={loading}
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : `Pay ₦${price.toLocaleString()}`}
          </Button>
        </div>
      </div>
    </div>
  );
}