/**
 * Company-only operations (dashboard, team, profile, subscription). Everything a company
 * shares with an agent (listings, bookings, inspections, subaccount) lives in `./owner`.
 */
import apiClient from './client';
import type { CompanyAgent, Company } from '../types';
import { toApiFailure } from './apiError';

interface CompanyDashboardResponse {
  success: boolean;
  data?: {
    overview: {
      totalListings: number;
      totalAgents: number;
      activeBookings: number;
      monthlyRevenue: number;
      trends: {
        listings: number;
        agents: number;
        bookings: number;
        revenue: number;
      };
    };
    plan: {
      name: string;
      billingCycle: string;
      slotUsage: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
  error?: { message: string };
}

interface CompanyAgentsResponse {
  success: boolean;
  data?: {
    agents: CompanyAgent[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
  error?: { message: string };
}

export const companyApi = {
  async getDashboard(): Promise<CompanyDashboardResponse> {
    try {
      const response = await apiClient.get<CompanyDashboardResponse>('/company/dashboard');
      return response.data;
    } catch (err) {
      return toApiFailure(err, 'Failed to fetch dashboard');
    }
  },

  async getAgents(params?: { search?: string; status?: string; limit?: number; page?: number }): Promise<CompanyAgentsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<CompanyAgentsResponse>(`/company/agents${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch (err) {
      return toApiFailure(err, 'Failed to fetch agents');
    }
  },

  async inviteAgent(email: string, fullName: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/company/agents/invite', { email, fullName });
      return response.data;
    } catch (err) {
      return toApiFailure(err, 'Failed to invite agent');
    }
  },

  async updateAgent(id: string, data: { fullName?: string; phone?: string; status?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string }>(`/company/agents/${id}`, data);
      return response.data;
    } catch (err) {
      return toApiFailure(err, 'Failed to update agent');
    }
  },

  async removeAgent(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/company/agents/${id}`);
      return response.data;
    } catch (err) {
      return toApiFailure(err, 'Failed to remove agent');
    }
  },

  async getProfile(): Promise<{ success: boolean; company?: Partial<Company>; message?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>('/company/profile');
      const company = response.data.data?.company || response.data.data;
      return { success: true, company };
    } catch (err) {
      return toApiFailure(err, 'Failed to fetch company profile');
    }
  },

  async updateProfile(data: { name?: string; phone?: string; address?: string; description?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const payload: any = { ...data };
      if (data.address) payload.officeAddress = data.address;
      if (data.name) payload.tradingName = data.name;
      const response = await apiClient.put<{ success: boolean; message?: string }>('/company/profile', payload);
      return response.data;
    } catch (err) {
      return toApiFailure(err, 'Failed to update company profile');
    }
  },

  async getSubscription(): Promise<{ success: boolean; subscription?: { name: string; billingCycle: string; expiresAt?: string }; message?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>('/company/subscription');
      const subscription = response.data.data?.subscription || response.data.data?.plan;
      return { success: true, subscription };
    } catch (err) {
      return toApiFailure(err, 'Failed to fetch subscription');
    }
  },
};

export default companyApi;