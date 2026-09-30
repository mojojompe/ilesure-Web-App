import apiClient from './client';
import { toApiFailure } from './apiError';

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
    } catch (error) {
      return toApiFailure(error, 'Failed to fetch notifications');
    }
  },

  async getUnreadCount(): Promise<{ success: boolean; count?: number; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; count: number }>('/notifications/unread-count');
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to fetch count');
    }
  },

  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to mark as read');
    }
  },

  async markAllAsRead(): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>('/notifications/read-all');
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to mark all as read');
    }
  },

  async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to delete notification');
    }
  },

  async getSettings(): Promise<{ success: boolean; data?: NotificationSettings; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: NotificationSettings }>('/notifications/settings');
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to fetch settings');
    }
  },

  async updateSettings(settings: Partial<NotificationSettings>): Promise<{ success: boolean; error?: { message: string } }> {
    try {
      const response = await apiClient.put<{ success: boolean }>('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      return toApiFailure(error, 'Failed to update settings');
    }
  },
};

export default notificationsApi;