import apiClient from './client';
import type { User } from '../types';

interface ProfileResponse {
  success: boolean;
  data?: User;
  error?: { message: string };
}

interface NotificationSettings {
  newBooking: boolean;
  listingInquiry: boolean;
  paymentReceived: boolean;
  listingView: boolean;
  systemUpdates: boolean;
}

interface NotificationSettingsResponse {
  success: boolean;
  data?: NotificationSettings;
}

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  avatar?: string;
}

export const userApi = {
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await apiClient.get<ProfileResponse>('/users/profile');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch profile' } };
    }
  },

  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    try {
      const response = await apiClient.put<ProfileResponse>('/users/profile', data);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to update profile' } };
    }
  },

  async getNotificationSettings(): Promise<NotificationSettingsResponse> {
    try {
      const response = await apiClient.get<NotificationSettingsResponse>('/users/notifications');
      return response.data;
    } catch {
      return { success: false };
    }
  },

  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettingsResponse> {
    try {
      const response = await apiClient.put<NotificationSettingsResponse>('/users/notifications', settings);
      return response.data;
    } catch {
      return { success: false };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string }>('/users/password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch {
      return { success: false, message: 'Failed to change password' };
    }
  },
};

export default userApi;