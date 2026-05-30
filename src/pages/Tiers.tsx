import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import tiersApi from '../api/tiers';
import type { Tier, UserRole } from '../types';

interface TierPageProps {
  role: UserRole;
}

export function TierPage({ role }: TierPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    const response = await tiersApi.getTiers();
    if (response.success && response.data) {
      setTiers(response.data.tiers);
    }
    setLoading(false);
  };

  const handleSelectTier = (tierId: string) => {
    navigate(`/payment?tier=${tierId}&billing=${billingCycle}`);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `₦${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white py-8 px-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-mustard" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            Choose Your Plan
          </h1>
          <p className="text-text-tertiary mt-1">
            Select the plan that best fits your needs
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-pill p-1 border border-clay-border flex">
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
            <button
              onClick={() => setBillingCycle('annually')}
              className={clsx(
                'px-6 py-2 rounded-pill text-sm font-medium transition-all',
                billingCycle === 'annually'
                  ? 'bg-burnt-brown text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Annually <span className="text-xs opacity-75">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(tier => {
            const price = billingCycle === 'annually' && tier.price > 0
              ? Math.round(tier.price * 12 * 0.8)
              : tier.price;
            const isPopular = tier.isPopular;

            return (
              <div
                key={tier.id}
                className={clsx(
                  'clay-card p-6 relative',
                  isPopular && 'ring-2 ring-mustard'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-mustard text-white text-xs font-semibold px-3 py-1 rounded-pill">
                      Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                  {tier.description && (
                    <p className="text-xs text-text-tertiary mt-1">{tier.description}</p>
                  )}
                </div>

                <div className="text-center mb-6">
                  <span className="text-3xl font-bold text-text-primary">{formatPrice(price)}</span>
                  {price > 0 && (
                    <span className="text-sm text-text-tertiary">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSelectTier(tier.id)}
                  variant={isPopular ? 'mustard' : 'primary'}
                  className="w-full"
                >
                  Select Plan <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}