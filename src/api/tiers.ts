import apiClient from './client';
import type { Tier } from '../types';
import { toApiFailure } from './apiError';

interface TiersResponse {
  success: boolean;
  data?: {
    tiers: Tier[];
  };
  error?: { message: string };
}

/** GET /tiers/me `entitlements` (newer backends). Every field optional: code defensively. */
export interface TierEntitlements {
  limit?: number;
  used?: number;
  remaining?: number;
  percentage?: number;
  purchasedSlots?: number;
  features?: Record<string, unknown>;
  tierId?: string;
}

export interface MyTierData {
  tierId: string;
  name: string;
  expiresAt: string | null;
  listingsUsed: number;
  listingsLimit: number;
  billingCycle?: 'monthly' | 'annually';
  entitlements?: TierEntitlements;
}

interface MyTierResponse {
  success: boolean;
  data?: MyTierData;
  error?: { message: string };
}

const finiteOrUndefined = (n: unknown): number | undefined =>
  typeof n === 'number' && Number.isFinite(n) ? n : undefined;

/**
 * Listing cap and usage from GET /tiers/me: `entitlements` first, then the older
 * `listingsLimit` / `listingsUsed` fields. Undefined when the server did not say;
 * callers must not substitute a hard-coded table.
 */
export function resolveMyTierUsage(data?: MyTierData | null): { tierId: string; limit?: number; used?: number } {
  const ent = data?.entitlements;
  return {
    tierId: ent?.tierId || data?.tierId || 'free',
    limit: finiteOrUndefined(ent?.limit) ?? finiteOrUndefined(data?.listingsLimit),
    used: finiteOrUndefined(ent?.used) ?? finiteOrUndefined(data?.listingsUsed),
  };
}

/** maxListings for a tier id from the public GET /tiers catalogue. */
export function catalogueMaxListings(tiers: Tier[] | undefined, tierId: string): number | undefined {
  const t = tiers?.find((x) => x.id === tierId);
  return finiteOrUndefined(t?.features?.maxListings) ?? finiteOrUndefined(t?.limits?.maxListings);
}

interface SelectTierResponse {
  success: boolean;
  message?: string;
  data?: {
    subscriptionId: string;
    checkoutUrl?: string;
  };
  error?: { message: string };
}

export const tiersApi = {
  async getTiers(): Promise<TiersResponse> {
    try {
      const response = await apiClient.get<TiersResponse>('/tiers');
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to fetch tiers');
    }
  },

  async getMyTier(): Promise<MyTierResponse> {
    try {
      const response = await apiClient.get<MyTierResponse>('/tiers/me');
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to fetch your tier');
    }
  },

  async selectTier(tierId: string, billingCycle: 'monthly' | 'annually', callbackUrl?: string): Promise<SelectTierResponse> {
    try {
      const resolvedCallbackUrl =
        callbackUrl ||
        (typeof window !== 'undefined' ? `${window.location.origin}/payment/callback` : undefined);
      const response = await apiClient.post<SelectTierResponse>('/tiers/select', {
        tierId,
        billingCycle,
        callbackUrl: resolvedCallbackUrl,
      });
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to select tier');
    }
  },
};

export default tiersApi;