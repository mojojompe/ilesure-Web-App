import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, X, Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';
import paymentsApi from '../api/payments';
import { useAuth } from '../api/authContext';

type Status = 'verifying' | 'success' | 'failed';

export function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('verifying');
  const [tierName, setTierName] = useState('');
  
  const { user } = useAuth();
  const returnUrl = localStorage.getItem('paymentReturnUrl');

  const handleReturn = () => {
    if (returnUrl) {
      localStorage.removeItem('paymentReturnUrl');
      navigate(returnUrl);
    } else {
      const fallbackUrl = user?.role === 'company' ? '/company' : '/agent';
      navigate(fallbackUrl);
    }
  };

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      setStatus('failed');
      return;
    }

    const verify = async () => {
      try {
        const result = await paymentsApi.verify(reference);
        if (result.status === 'success') {
          setStatus('success');
          setTierName(result.newTier || '');
        } else {
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="clay-card p-8">
          {status === 'verifying' && (
            <>
              <Loader className="w-12 h-12 animate-spin text-mustard mx-auto mb-4" />
              <h1 className="text-xl font-bold text-text-primary mb-2">
                Verifying Payment
              </h1>
              <p className="text-text-tertiary">
                Please wait while we confirm your transaction...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-status-success/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-status-success" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Payment Successful!
              </h1>
              <p className="text-text-tertiary mb-6">
                {tierName ? `You are now on the ${tierName} plan` : 'Your plan has been activated'}
              </p>
              <Button
                onClick={handleReturn}
                variant="primary"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Payment Failed
              </h1>
              <p className="text-text-tertiary mb-6">
                Something went wrong. Please try again.
              </p>
              <Button
                onClick={() => {
                  const fallbackUrl = returnUrl || '/tiers';
                  navigate(fallbackUrl);
                }}
                variant="primary"
                className="w-full"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;
