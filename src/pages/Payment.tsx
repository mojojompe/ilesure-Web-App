import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';
import paymentsApi from '../api/payments';

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState('');

  const tierId = searchParams.get('tier') || '';
  const billing = (searchParams.get('billing') || 'monthly') as 'monthly' | 'annually';

  useEffect(() => {
    if (!tierId) {
      navigate('/tiers', { replace: true });
    }
  }, [tierId, navigate]);

  const handleProceed = async () => {
    setInitializing(true);
    setError('');

    try {
      const result = await paymentsApi.initialize({ tierId, billingCycle: billing });
      window.location.href = result.authorizationUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
      setInitializing(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_payment.png')" }}
    >
      <div className="w-full max-w-md text-center">
        <div className="clay-card p-8">
          {initializing ? (
            <>
              <Loader className="w-12 h-12 animate-spin text-mustard mx-auto mb-4" />
              <h1 className="text-xl font-bold text-text-primary mb-2">
                Redirecting to Paystack...
              </h1>
              <p className="text-text-tertiary">
                You will be redirected to Paystack's secure checkout page to complete your payment.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Ready to Pay
              </h1>
              <p className="text-text-tertiary mb-6">
                You'll be redirected to Paystack's secure checkout to complete your {billing} subscription.
              </p>
              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}
              <Button
                onClick={handleProceed}
                variant="primary"
                className="w-full"
              >
                Proceed to Paystack
              </Button>
              <Button
                onClick={() => navigate('/tiers')}
                variant="secondary"
                className="w-full mt-3"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
