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

  async submitKycReference(referenceId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/users/kyc', {
        referenceId,
      });
      return response.data;
    } catch {
      return { success: false, message: 'Failed to submit KYC verification' };
    }
  },

  async submitCompanyVerification(formData: FormData): Promise<{ success: boolean; message?: string; data?: any; error?: { message: string } }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>('/kyc/company-documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.error?.message || 'Failed to submit company documents' };
    }
  },

  /** Agent/landlord onboarding documents (QA-AGT-002) → POST /kyc/agent-documents. */
  async submitAgentDocuments(formData: FormData): Promise<{ success: boolean; message?: string; data?: any; error?: { message: string } }> {
    try {
      const response = await apiClient.upload<{ success: boolean; message?: string; data?: any }>('/kyc/agent-documents', formData);
      return response.data;
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.error?.message || 'Failed to upload documents' };
    }
  },

  async getKycStatus(): Promise<{ success: boolean; data?: KycStatus; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; data?: KycStatus; error?: { message: string } }>('/kyc/status');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch verification status' } };
    }
  },

  async initializeKyc(type: 'nin' | 'bvn'): Promise<{ success: boolean; data?: { referenceId: string; widgetId: string; widgetUrl: string; html: string }; error?: { message: string } }> {
    try {
      const response = await apiClient.post<{ success: boolean; data?: { referenceId: string; widgetId: string; widgetUrl: string; html: string }; error?: { message: string } }>('/kyc/initialize', { type });
      return response.data;
    } catch (err: any) {
      return { success: false, error: { message: err?.response?.data?.error?.message || 'Failed to initialize verification' } };
    }
  },

  async verifyKyc(referenceId: string, type: 'nin' | 'bvn'): Promise<{ success: boolean; data?: any; error?: { message: string } }> {
    try {
      const response = await apiClient.post<{ success: boolean; data?: any; error?: { message: string } }>('/kyc/verify', { referenceId, type });
      return response.data;
    } catch (err: any) {
      return { success: false, error: { message: err?.response?.data?.error?.message || 'Failed to verify' } };
    }
  },

  async syncKyc(type?: 'nin' | 'bvn'): Promise<{ success: boolean; data?: any; error?: { message: string } }> {
    try {
      const response = await apiClient.post<{ success: boolean; data?: any; error?: { message: string } }>('/kyc/sync', type ? { type } : {});
      return response.data;
    } catch (err: any) {
      return { success: false, error: { message: err?.response?.data?.error?.message || 'Failed to sync verification' } };
    }
  },
};

interface KycStatus {
  ninVerified: boolean;
  bvnVerified: boolean;
  verificationStatus: string;
  role: string;
  ninVerifiedAt?: string;
  bvnVerifiedAt?: string;
  ninPhoto?: string;
  bvnPhoto?: string;
}

export type { KycStatus };

export default userApi;