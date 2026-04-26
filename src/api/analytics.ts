import apiClient from './client';

interface AnalyticsResponse {
  success: boolean;
  data?: {
    totalViews: number;
    totalSaves: number;
    totalInquiries: number;
    conversionRate: number;
    changes: {
      views: number;
      saves: number;
      inquiries: number;
    };
    viewsTrend: Array<{ date: string; value: number }>;
    topListings: Array<{
      id: string;
      title: string;
      views: number;
      saves: number;
    }>;
  };
  error?: { message: string };
}

export const analyticsApi = {
  async getAgentAnalytics(): Promise<AnalyticsResponse> {
    try {
      const response = await apiClient.get<AnalyticsResponse>('/agent/analytics');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch analytics' } };
    }
  },

  async getAgentViewsTrend(period: string = '30d'): Promise<AnalyticsResponse> {
    try {
      const response = await apiClient.get<AnalyticsResponse>(`/agent/analytics/views?period=${period}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch views trend' } };
    }
  },

  async getAgentTopListings(): Promise<AnalyticsResponse> {
    try {
      const response = await apiClient.get<AnalyticsResponse>('/agent/analytics/listings');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch top listings' } };
    }
  },
};

export default analyticsApi;