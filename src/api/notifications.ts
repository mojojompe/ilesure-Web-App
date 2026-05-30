import axios from 'axios';
import apiClient from './client';

export interface Notification {
  _id: string;
  type: 'match' | 'listing' | 'waitlist' | 'interest' | 'booking' | 'verification' | 'message' | 'system';
  title: string;
  body: string;
  read: boolean;
  readAt?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationSettings {
  newBooking: boolean;
  listingInquiry: boolean;
  paymentReceived: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
}

interface NotificationsResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
  unreadCount?: number;
  error?: { message: string };
}

export const notificationsApi = {
  async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    try {
      const response = await apiClient.get<NotificationsResponse>('/notifications', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to fetch notifications' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async getUnreadCount(): Promise<{ success: boolean; count?: number; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; count: number }>('/notifications/unread-count');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to fetch count' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to mark as read' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async markAllAsRead(): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>('/notifications/read-all');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to mark all as read' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/notifications/${notificationId}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to delete notification' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async getSettings(): Promise<{ success: boolean; data?: NotificationSettings; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: NotificationSettings }>('/notifications/settings');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to fetch settings' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async updateSettings(settings: Partial<NotificationSettings>): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.put<{ success: boolean }>('/notifications/settings', settings);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to update settings' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },
};

export default notificationsApi;