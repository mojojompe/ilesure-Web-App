import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, ArrowRight, Loader2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import tiersApi from '../api/tiers';
import { paymentsApi } from '../api/payments';
import type { Tier, UserRole } from '../types';

export const getWebTierBullets = (tier: Tier) => {
  const id = tier.id?.toLowerCase() || '';
  const slots = tier.features?.maxListings ?? (id === 'free' ? 5 : id === 'basic' ? 15 : id === 'premium' ? 30 : 50);

  if (id === 'free') {
    return [
      { text: `Up to ${slots} active listing slots`, positive: true },
      { text: 'In-App Chat Only (No direct WhatsApp/Calls)', positive: false },
      { text: 'Standard Platform Visibility', positive: true },
      { text: 'Basic View & Save Analytics', positive: true },
      { text: 'Community & In-App Help', positive: true },
    ];
  }
  if (id === 'basic') {
    return [
      { text: `Up to ${slots} active listing slots`, positive: true },
      { text: 'Direct WhatsApp & Phone Call Buttons', positive: true, highlight: true },
      { text: 'Verified Partner Badge on Listings', positive: true },
      { text: 'Priority Listing Visibility', positive: true },
      { text: 'Detailed Booking & Lead Analytics', positive: true },
      { text: 'Priority Email Support', positive: true },
    ];
  }
  if (id === 'premium') {
    return [
      { text: `Up to ${slots} active listing slots`, positive: true },
      { text: 'Instant WhatsApp & Phone Call Buttons', positive: true, highlight: true },
      { text: 'Gold FEATURED Ribbon in Discovery', positive: true, highlight: true },
      { text: 'Featured Partner Checkmark Badge', positive: true },
      { text: 'Advanced Demand & Trend Analytics', positive: true },
      { text: 'Priority Phone + Email Support', positive: true },
    ];
  }
  // Enterprise
  return [
    { text: `Up to ${slots} active listing slots`, positive: true },
    { text: 'Direct WhatsApp & VIP Call Access', positive: true, highlight: true },
    { text: 'TOP PICK Top-of-Feed Placement', positive: true, highlight: true },
    { text: 'Diamond Partner Verified Badge', positive: true },
    { text: 'Full Reporting & Demand Heatmap', positive: true },
    { text: 'Dedicated Account Manager', positive: true },
  ];
};

interface TierPageProps {
  role: UserRole;
}

export function TierPage({ role }: TierPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [myTier, setMyTier] = useState<{
    tierId: string;
    name: string;
    expiresAt: string | null;
    listingsUsed?: number;
    listingsLimit?: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadTiersAndSubscription();
  }, []);

  const loadTiersAndSubscription = async () => {
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

  const expiresDate = myTier?.expiresAt ? new Date(myTier.expiresAt) : null;
  const isExpired = expiresDate ? expiresDate.getTime() <= Date.now() : true;
  const daysRemaining = expiresDate && !isExpired
    ? Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const priceFor = (tier: Tier): number => {
    const monthly = tier.priceMonthly ?? tier.price ?? 0;
    return billingCycle === 'annually'
      ? (tier.priceYearly ?? Math.round(monthly * 12 * 0.8))
      : monthly;
  };

  const formatPrice = (tier: Tier) => {
    const price = priceFor(tier);
    if ((tier.priceMonthly ?? tier.price) === 0) return 'Free';
    return `₦${price.toLocaleString()}`;
  };

  const handleSelectTier = async (tier: Tier) => {
    setErrorMsg(null);
    const tierCanonical = tier.id.toLowerCase();
    const currentTierCanonical = myTier?.tierId?.toLowerCase();
    const isCurrentPlan = currentTierCanonical === tierCanonical;
    const isPlanActive = isCurrentPlan && !isExpired;

    // Prevent duplicate payment if already active with more than 7 days left
    if (isPlanActive && daysRemaining > 7) {
      setErrorMsg(
        `You already have an active ${tier.name} plan with ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining. Renewal will be available 7 days before expiration.`
      );
      return;
    }

    const price = priceFor(tier);
    if (price === 0) {
      try {
        await paymentsApi.initialize({ tierId: tier.id, billingCycle });
      } catch (err: any) {
        // Fall through
      }
      navigate(role === 'company' ? '/company' : '/agent', { replace: true });
      return;
    }

    navigate(`/payment?tier=${tier.id}&billing=${billingCycle}`);
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
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            Choose Your Plan
          </h1>
          <p className="text-text-tertiary mt-1">
            Select the plan that best fits your business needs
          </p>
        </div>

        {/* Current Active Plan Banner */}
        {myTier && myTier.tierId !== 'free' && !isExpired && (
          <div className="mb-6 p-4 rounded-clay bg-white border-2 border-mustard/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-mustard-pale text-burnt-brown">
                <ShieldCheck className="w-6 h-6 text-burnt-brown" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-burnt-brown">Active Subscription</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-mustard text-white capitalize">
                    {myTier.name || myTier.tierId}
                  </span>
                </div>
                <p className="text-sm text-text-tertiary mt-0.5">
                  Expires on <span className="font-semibold text-text-primary">{expiresDate?.toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-clay-sm bg-burnt-brown text-white font-medium text-sm">
              <Clock className="w-4 h-4 text-mustard" />
              <span>{daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-clay bg-status-danger/10 border border-status-danger/20 flex items-center gap-3 text-status-danger text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-pill p-1 border border-clay-border flex shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={clsx(
                'px-6 py-2 rounded-pill text-sm font-medium transition-all',
                billingCycle === 'monthly'
                  ? 'bg-burnt-brown text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={clsx(
                'px-6 py-2 rounded-pill text-sm font-medium transition-all flex items-center gap-1.5',
                billingCycle === 'annually'
                  ? 'bg-burnt-brown text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <span>Yearly</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-mustard text-burnt-brown font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(tier => {
            const price = priceFor(tier);
            const isPopular = tier.isPopular;
            const tierCanonical = tier.id.toLowerCase();
            const currentTierCanonical = myTier?.tierId?.toLowerCase();
            const isCurrentPlan = currentTierCanonical === tierCanonical;
            const isPlanActive = isCurrentPlan && !isExpired;
            const canRenew = isCurrentPlan && (!isPlanActive || daysRemaining <= 7);

            return (
              <div
                key={tier.id}
                className={clsx(
                  'clay-card p-6 relative flex flex-col justify-between transition-all',
                  isCurrentPlan && 'ring-2 ring-mustard bg-mustard-pale/30',
                  isPopular && !isCurrentPlan && 'ring-2 ring-burnt-brown/20'
                )}
              >
                {isCurrentPlan ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-burnt-brown text-white text-xs font-semibold px-3 py-1 rounded-pill shadow-sm">
                      Current Plan
                    </span>
                  </div>
                ) : isPopular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-mustard text-burnt-brown text-xs font-bold px-3 py-1 rounded-pill shadow-sm">
                      Popular
                    </span>
                  </div>
                ) : null}

                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                    {tier.description && (
                      <p className="text-xs text-text-tertiary mt-1">{tier.description}</p>
                    )}
                  </div>

                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-text-primary">{formatPrice(tier)}</span>
                    {price > 0 && (
                      <span className="text-sm text-text-tertiary">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    )}
                  </div>

                  {/* Active Countdown for Current Plan */}
                  {isCurrentPlan && isPlanActive && (
                    <div className="mb-4 py-2 px-3 rounded-clay-sm bg-burnt-brown/10 text-center">
                      <p className="text-xs font-bold text-burnt-brown flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining
                      </p>
                    </div>
                  )}

                  <div className="space-y-2.5 mb-6">
                    {getWebTierBullets(tier).map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-sm">
                        {bullet.positive ? (
                          <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
                        )}
                        <span className={clsx(
                          bullet.positive ? 'text-text-secondary' : 'text-text-tertiary opacity-70',
                          bullet.highlight && 'font-semibold text-text-primary'
                        )}>
                          {bullet.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {isPlanActive && !canRenew ? (
                    <div>
                      <Button
                        disabled
                        variant="secondary"
                        className="w-full opacity-60 cursor-not-allowed"
                      >
                        Active Plan
                      </Button>
                      <p className="text-[11px] text-text-tertiary text-center mt-2">
                        Renewal available 7 days before expiry
                      </p>
                    </div>
                  ) : isPlanActive && canRenew ? (
                    <div>
                      <Button
                        onClick={() => handleSelectTier(tier)}
                        variant="mustard"
                        className="w-full"
                      >
                        Renew Plan <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <p className="text-[11px] text-status-warning text-center mt-2 font-medium">
                        Expires in {daysRemaining} day{daysRemaining === 1 ? '' : 's'} — Renew now
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSelectTier(tier)}
                      variant={isPopular ? 'mustard' : 'primary'}
                      className="w-full"
                    >
                      {price === 0 ? 'Select Free' : 'Upgrade Plan'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}