/**
 * Agent-only operations. Everything an agent shares with a company (listings, bookings,
 * inspections, subaccount, uploads) lives in `./owner`, parameterised by role.
 */
import apiClient from './client';
import type { Listing, Booking } from '../types';
import { toApiFailure } from './apiError';

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

export const agentApi = {
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const response = await apiClient.get<DashboardResponse>('/agent/dashboard');
      return response.data;
    } catch (err) {
      return toApiFailure(err, 'Failed to fetch dashboard');
    }
  },
};

export default agentApi;
