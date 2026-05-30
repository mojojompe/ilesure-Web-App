import axios from 'axios';
import apiClient from './client';
import type { User, UserRole } from '../types';

interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  onboardingRequired?: boolean;
  nextStep?: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: {
    message: string;
  };
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  referrerCode?: string;
}

interface SendOtpResponse {
  success: boolean;
  message?: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      const data = response.data;
      
      if (data.success && data.user && data.accessToken) {
        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          onboardingRequired: data.onboardingRequired,
          nextStep: data.nextStep,
        };
      }
      
      return {
        success: false,
        error: { message: data.error?.message || 'Login failed' },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            message: error.response?.data?.error?.message || 'Login failed',
          },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      const resData = response.data;
      
      if (resData.success && resData.user && resData.accessToken) {
        return {
          success: true,
          user: resData.user,
          accessToken: resData.accessToken,
          refreshToken: resData.refreshToken,
          onboardingRequired: resData.onboardingRequired,
          nextStep: resData.nextStep,
        };
      }
      
      return {
        success: false,
        error: { message: resData.error?.message || 'Registration failed' },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            message: error.response?.data?.error?.message || 'Registration failed',
          },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async sendOtp(email: string): Promise<SendOtpResponse> {
    try {
      const response = await apiClient.post<SendOtpResponse>('/auth/resend-otp', { email });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.error?.message || 'Failed to send OTP',
        };
      }
      return { success: false, message: 'Network error' };
    }
  },

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/verify-otp', { email, otp });
      const data = response.data;
      
      if (data.success && data.user && data.accessToken) {
        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          onboardingRequired: data.onboardingRequired,
          nextStep: data.nextStep,
        };
      }
      
      return {
        success: false,
        error: { message: data.error?.message || 'Verification failed' },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            message: error.response?.data?.error?.message || 'Verification failed',
          },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.error?.message || 'Failed to request password reset',
        };
      }
      return { success: false, message: 'Network error' };
    }
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>('/auth/reset-password', { email, token, newPassword });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.error?.message || 'Failed to reset password',
        };
      }
      return { success: false, message: 'Network error' };
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },
};

export default authApi;