import apiClient from './client';
import type { Listing, Booking } from '../types';

interface DashboardResponse {
  success: boolean;
  data?: {
    overview: {
      totalListings: number;
      activeListings: number;
      totalBookings: number;
      monthlyRevenue: number;
      totalViews: number;
      totalSaves: number;
      totalInquiries: number;
      trends: {
        listings: number;
        bookings: number;
        revenue: number;
      };
    };
    recentListings: Listing[];
    recentBookings: Booking[];
  };
  error?: { message: string };
}

interface ListingsResponse {
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

interface ListingResponse {
  success: boolean;
  data?: {
    listing: Listing;
    message?: string;
  };
  error?: { message: string };
}

interface CreateListingData {
  title: string;
  description: string;
  type: string;
  price: number;
  address: string;
  city: string;
  state: string;
  landmark?: string;
  amenities?: string[];
  images?: string[];
}

interface BookingsResponse {
  success: boolean;
  data?: {
    bookings: Booking[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
  error?: { message: string };
}

interface BookingResponse {
  success: boolean;
  data?: {
    booking: Booking;
    message?: string;
  };
  error?: { message: string };
}

export const agentApi = {
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const response = await apiClient.get<DashboardResponse>('/agent/dashboard');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch dashboard' } };
    }
  },

  async getListings(params?: { status?: string; search?: string; limit?: number; page?: number }): Promise<ListingsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<ListingsResponse>(`/agent/listings${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch listings' } };
    }
  },

  async getListing(id: string): Promise<ListingResponse> {
    try {
      const response = await apiClient.get<ListingResponse>(`/agent/listings/${id}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch listing' } };
    }
  },

  async createListing(data: CreateListingData): Promise<ListingResponse> {
    try {
      const response = await apiClient.post<ListingResponse>('/agent/listings', data);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to create listing' } };
    }
  },

  async updateListing(id: string, data: Partial<CreateListingData & { status: string }>): Promise<ListingResponse> {
    try {
      const response = await apiClient.put<ListingResponse>(`/agent/listings/${id}`, data);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to update listing' } };
    }
  },

  async archiveListing(id: string): Promise<ListingResponse> {
    try {
      const response = await apiClient.put<ListingResponse>(`/agent/listings/${id}/archive`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to archive listing' } };
    }
  },

  async restoreListing(id: string): Promise<ListingResponse> {
    try {
      const response = await apiClient.put<ListingResponse>(`/agent/listings/${id}/restore`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to restore listing' } };
    }
  },

  async deleteListing(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/agent/listings/${id}`);
      return response.data;
    } catch {
      return { success: false, message: 'Failed to delete listing' };
    }
  },

  async getBookings(params?: { status?: string; limit?: number; page?: number }): Promise<BookingsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<BookingsResponse>(`/agent/bookings${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch bookings' } };
    }
  },

  async updateBookingStatus(id: string, status: string): Promise<BookingResponse> {
    try {
      const response = await apiClient.put<BookingResponse>(`/agent/bookings/${id}`, { status });
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to update booking' } };
    }
  },
};

export default agentApi;