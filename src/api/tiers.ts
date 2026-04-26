import axios from 'axios';
import apiClient from './client';
import type { Tier } from '../types';

interface TiersResponse {
  success: boolean;
  data?: Tier[];
  error?: { message: string };
}

interface MyTierResponse {
  success: boolean;
  data?: {
    tier: Tier;
    subscription?: {
      status: 'active' | 'cancelled' | 'expired';
      currentPeriodEnd: string;
    };
  };
  error?: { message: string };
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to fetch tiers' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async getMyTier(): Promise<MyTierResponse> {
    try {
      const response = await apiClient.get<MyTierResponse>('/tiers/me');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to fetch your tier' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async selectTier(tierId: string, billingCycle: 'monthly' | 'annually'): Promise<SelectTierResponse> {
    try {
      const response = await apiClient.post<SelectTierResponse>('/tiers/select', {
        tierId,
        billingCycle,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to select tier' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },
};

export default tiersApi;