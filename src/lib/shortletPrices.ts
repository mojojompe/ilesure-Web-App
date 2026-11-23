/**
 * Price lines for a shortlet, as the lister sees them. Listings made with the wizard carry
 * `shortletRates` (tiers: "2 days ₦60,000"); older ones only the legacy `shortletPricing`
 * (hourly/daily/weekly/monthly). Pages used to read only the legacy field, so every new
 * shortlet showed ₦0 or its (zero) annual rent.
 */

export interface ShortletRateLike {
  id?: string;
  label?: string;
  durationValue?: number;
  durationUnit?: string;
  price?: number;
}

interface ShortletListingLike {
  shortletRates?: ShortletRateLike[] | null;
  shortletPricing?: { hourly?: number; daily?: number; weekly?: number; monthly?: number } | null;
}

const UNIT_SHORT: Record<string, string> = { hour: 'hr', day: 'day', week: 'wk', month: 'mo' };

/** "per 2 days", "/day": how long one unit of a tier lasts. */
export function shortletRatePeriod(rate: ShortletRateLike): string {
  const unit = rate.durationUnit || 'day';
  const value = Number(rate.durationValue) || 1;
  return value === 1 ? `/${UNIT_SHORT[unit] || unit}` : ` per ${value} ${unit}s`;
}

export function shortletPriceLines(listing: ShortletListingLike): string[] {
  const rates = (listing.shortletRates || []).filter((r) => Number(r?.price) > 0);
  if (rates.length > 0) {
    return [...rates]
      .sort((a, b) => Number(a.price) - Number(b.price))
      .map((r) => `₦${Number(r.price).toLocaleString()}${shortletRatePeriod(r)}`);
  }
  const p = listing.shortletPricing || {};
  return [
    p.hourly ? `₦${p.hourly.toLocaleString()}/hr` : null,
    p.daily ? `₦${p.daily.toLocaleString()}/day` : null,
    p.weekly ? `₦${p.weekly.toLocaleString()}/wk` : null,
    p.monthly ? `₦${p.monthly.toLocaleString()}/mo` : null,
  ].filter((line): line is string => Boolean(line));
}

/** What a shortlet booking costs: the tier booked × how many of it. */
export function shortletBookingTotal(booking: { selectedRate?: ShortletRateLike | null; rateQuantity?: number | null }): number | null {
  const price = Number(booking.selectedRate?.price);
  if (!(price > 0)) return null;
  return price * (Number(booking.rateQuantity) || 1);
}
