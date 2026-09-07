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
  /**
   * @param accessToken use this bearer instead of the stored one. Needed by the Google
   * callback, which must read the profile to decide whether the account may use this portal
   * BEFORE it writes a session to storage.
   */
  async getProfile(accessToken?: string): Promise<ProfileResponse> {
    try {
      const response = await apiClient.get<ProfileResponse>(
        '/users/profile',
        accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
      );
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

  // REMOVED: submitKycReference(). It posted to POST /users/kyc, which does not exist on
  // the backend, and nothing in the UI called it — KYC goes through initializeKyc/verifyKyc
  // against /kyc/*. A client method for a route that was never built is a trap for whoever
  // wires it up next.

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

  // RETIRED: submitAgentDocuments() — it posted to POST /kyc/agent-documents, the
  // individual-document KYC flow superseded by Dojah NIN/BVN verification. It had no
  // callers anywhere in the app, and the route has been withdrawn on the backend.

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