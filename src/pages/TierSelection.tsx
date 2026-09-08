import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import tiersApi from '../api/tiers';
import { paymentsApi } from '../api/payments';
import type { Tier } from '../types';

export function TierSelectionPage() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [myTier, setMyTier] = useState<{
    tierId: string;
    name: string;
    expiresAt: string | null;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const [tiersRes, myTierRes] = await Promise.all([
        tiersApi.getTiers(),
        tiersApi.getMyTier().catch(() => null),
      ]);
      if (tiersRes.success && tiersRes.data) {
        setTiers(tiersRes.data.tiers);
      }
      if (myTierRes && myTierRes.success && myTierRes.data) {
        setMyTier(myTierRes.data);
      }
    } catch (err) {
      console.error('Failed to load tiers:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Both prices are set per tier on the backend. This previously rendered the
   * MONTHLY price with a "/yr" suffix on the annual toggle, while checkout
   * charged price * 12 * 0.8 — so the quoted figure was roughly a tenth of what
   * the customer was actually billed.
   */
  const priceFor = (tier: Tier): number => {
    const monthly = tier.priceMonthly ?? tier.price ?? 0;
    return billingCycle === 'annually'
      ? (tier.priceYearly ?? Math.round(monthly * 12 * 0.8))
      : monthly;
  };

  const formatPrice = (tier: Tier) => {
    const amount = priceFor(tier);
    if ((tier.priceMonthly ?? tier.price) === 0) return 'Free';
    if (!amount) return 'Not available';
    return `₦${amount.toLocaleString()}${billingCycle === 'annually' ? '/yr' : '/mo'}`;
  };

  const handleContinue = async () => {
    if (!selectedTier) return;
    setErrorMsg(null);

    const chosen = tiers.find((t) => t.id === selectedTier);
    if (!chosen) return;

    const expiresDate = myTier?.expiresAt ? new Date(myTier.expiresAt) : null;
    const isExpired = expiresDate ? expiresDate.getTime() <= Date.now() : true;
    const daysRemaining = expiresDate && !isExpired
      ? Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    const isSameTier = myTier?.tierId?.toLowerCase() === chosen.id.toLowerCase();
    if (isSameTier && !isExpired && daysRemaining > 7) {
      setErrorMsg(`You already have an active ${chosen.name} subscription with ${daysRemaining} day(s) remaining. Renewal is available 7 days before expiration.`);
      return;
    }

    const isFree = (chosen.priceMonthly ?? chosen.price) === 0;
    if (isFree) {
      try {
        await paymentsApi.initialize({ tierId: selectedTier, billingCycle });
      } catch {
        // Activation is idempotent server-side; fall through to the dashboard either way.
      }
      navigate('/agent', { replace: true });
      return;
    }
    navigate(`/payment?tier=${selectedTier}&billing=${billingCycle}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white py-8 px-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-mustard" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat py-8 px-4"
      style={{ backgroundImage: "linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url('/bg_tier.png')" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Choose Your Plan</h1>
          <p className="text-text-tertiary mt-1">Select the plan that fits your needs</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-clay bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm text-center">
            {errorMsg}
          </div>
        )}

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
              Yearly
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tiers.map(tier => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              disabled={selecting}
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
                <p className="text-2xl font-bold text-text-primary mt-1">{formatPrice(tier)}</p>
                {/* BUGFIX (QA-AGT-024): unguarded nested access crashed the page to blank when a
                    tier came back without `limits` — the very next block already guards `features`. */}
                {tier.limits?.maxListings !== undefined && (
                  <p className="text-xs text-text-tertiary mt-1">{tier.limits.maxListings} listing slots</p>
                )}
              </div>

              <div className="space-y-2">
                {tier.features?.maxListings !== undefined && (
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">Up to {tier.features.maxListings} active listing slots</span>
                  </div>
                )}
                {tier.features?.analytics && (
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{tier.features.analytics}</span>
                  </div>
                )}
                {tier.features?.support && (
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{tier.features.support}</span>
                  </div>
                )}
                {tier.features?.visibility && (
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{tier.features.visibility}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full max-w-md mx-auto"
          disabled={!selectedTier || selecting}
          onClick={handleContinue}
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}