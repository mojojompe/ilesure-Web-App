import apiClient from './client';
import type { Listing, Booking, CompanyAgent, Company } from '../types';

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

interface CompanyListingsResponse {
  success: boolean;
  data?: {
    listings: Listing[];
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
    } catch {
      return { success: false, error: { message: 'Failed to fetch dashboard' } };
    }
  },

  async getListings(params?: { status?: string; search?: string; limit?: number; page?: number }): Promise<CompanyListingsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<CompanyListingsResponse>(`/company/listings${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch listings' } };
    }
  },

  async createListing(data: {
    title: string;
    description: string;
    type: string;
    price: number;
    address: string;
    city: string;
    state: string;
  }): Promise<{ success: boolean; listing?: Listing; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { listing: Listing } }>('/company/listings', data);
      return { success: true, listing: response.data.data.listing };
    } catch {
      return { success: false, message: 'Failed to create listing' };
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
    } catch {
      return { success: false, error: { message: 'Failed to fetch agents' } };
    }
  },

  async inviteAgent(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/company/agents/invite', { email });
      return response.data;
    } catch {
      return { success: false, message: 'Failed to invite agent' };
    }
  },

  async updateAgent(id: string, data: { fullName?: string; phone?: string; status?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string }>(`/company/agents/${id}`, data);
      return response.data;
    } catch {
      return { success: false, message: 'Failed to update agent' };
    }
  },

  async removeAgent(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/company/agents/${id}`);
      return response.data;
    } catch {
      return { success: false, message: 'Failed to remove agent' };
    }
  },

  async updateListing(id: string, data: { status?: string; title?: string; description?: string; price?: number }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string }>(`/company/listings/${id}`, data);
      return response.data;
    } catch {
      return { success: false, message: 'Failed to update listing' };
    }
  },

  async getBookings(params?: { status?: string; limit?: number; page?: number }): Promise<{ success: boolean; bookings?: Booking[]; message?: string }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<{ success: boolean; data: { bookings: Booking[] } }>(`/company/bookings${queryString ? `?${queryString}` : ''}`);
      return { success: true, bookings: response.data.data.bookings };
    } catch {
      return { success: false, message: 'Failed to fetch bookings' };
    }
  },

  async updateBookingStatus(id: string, status: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string }>(`/company/bookings/${id}`, { status });
      return response.data;
    } catch {
      return { success: false, message: 'Failed to update booking' };
    }
  },

  async getProfile(): Promise<{ success: boolean; company?: Partial<Company>; message?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { company: Partial<Company> } }>('/company/profile');
      return { success: true, company: response.data.data.company };
    } catch {
      return { success: false, message: 'Failed to fetch company profile' };
    }
  },

  async updateProfile(data: { name?: string; phone?: string; address?: string; description?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string }>('/company/profile', data);
      return response.data;
    } catch {
      return { success: false, message: 'Failed to update company profile' };
    }
  },

  async getSubscription(): Promise<{ success: boolean; subscription?: { name: string; billingCycle: string; expiresAt?: string }; message?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { subscription: { name: string; billingCycle: string; expiresAt?: string } } }>('/company/subscription');
      return { success: true, subscription: response.data.data.subscription };
    } catch {
      return { success: false, message: 'Failed to fetch subscription' };
    }
  },
};

export default companyApi;