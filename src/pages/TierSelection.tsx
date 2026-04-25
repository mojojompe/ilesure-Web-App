import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';

interface Tier {
  id: string;
  name: string;
  price: number;
  slots: number;
  features: string[];
  isPopular?: boolean;
}

const tiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    slots: 5,
    features: [
      'Up to 5 listing slots',
      'Basic support',
      'Standard listings',
      'Email notifications',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 10000,
    slots: 15,
    features: [
      'Up to 15 listing slots',
      'Priority support',
      'Featured listings',
      'SMS notifications',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 35000,
    slots: 30,
    features: [
      'Up to 30 listing slots',
      '24/7 priority support',
      'Top placement',
      'Analytics dashboard',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 70000,
    slots: 50,
    features: [
      'Up to 50 listing slots',
      'Dedicated account manager',
      'White-label solution',
      'Custom integrations',
    ],
  },
];

export function TierSelectionPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    if (billingCycle === 'yearly') {
      return `₦${price.toLocaleString()}/yr`;
    }
    return `₦${Math.round(price / 12).toLocaleString()}/mo`;
  };

  const handleContinue = () => {
    if (selectedTier) {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-off-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Choose Your Plan</h1>
          <p className="text-text-tertiary mt-1">Select the plan that fits your needs</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-pill p-1 border border-clay-border flex">
            <button
              onClick={() => setBillingCycle('yearly')}
              className={clsx(
                'px-6 py-2 rounded-pill text-sm font-medium transition-all',
                billingCycle === 'yearly'
                  ? 'bg-burnt-brown text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Yearly
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={clsx(
                'px-6 py-2 rounded-pill text-sm font-medium transition-all',
                billingCycle === 'monthly'
                  ? 'bg-burnt-brown text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tiers.map(tier => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              className={clsx(
                'clay-card p-5 text-left transition-all relative',
                selectedTier === tier.id
                  ? 'ring-2 ring-mustard bg-mustard-pale'
                  : 'hover:shadow-clay-hover hover:-translate-y-0.5',
                tier.isPopular && 'sm:col-span-1'
              )}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-mustard text-white text-xs font-semibold px-3 py-1 rounded-pill">
                    Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                <p className="text-2xl font-bold text-text-primary mt-1">{formatPrice(tier.price)}</p>
                <p className="text-xs text-text-tertiary mt-1">{tier.slots} listing slots</p>
              </div>

              <div className="space-y-2">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-status-success flex-shrink-0" />
                    <span className="text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full max-w-md mx-auto"
          disabled={!selectedTier}
          onClick={handleContinue}
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}