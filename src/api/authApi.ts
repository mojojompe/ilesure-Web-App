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
  alreadyVerified?: boolean;
}

interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      const body = response.data;

      // SECURITY-FIX / DECISION (W-M2): the documented contract nests
      // { user, accessToken, refreshToken } under `data`, but this code assumed top-level.
      // Read from either shape so login works regardless of which the backend returns.
      // The `success`/`error`/`onboardingRequired`/`nextStep` envelope stays top-level.
      const data = body.data ?? body;

      if (body.success && data.user && data.accessToken) {
        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          onboardingRequired: body.onboardingRequired,
          nextStep: body.nextStep,
        };
      }

      return {
        success: false,
        error: { message: body.error?.message || 'Login failed' },
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
      const body = response.data;

      // SECURITY-FIX / DECISION (W-M2): tolerate both nested (`body.data`) and top-level
      // token/user shapes, consistent with login().
      const resData = body.data ?? body;

      if (body.success && resData.user && resData.accessToken) {
        return {
          success: true,
          user: resData.user,
          accessToken: resData.accessToken,
          refreshToken: resData.refreshToken,
          onboardingRequired: body.onboardingRequired,
          nextStep: body.nextStep,
        };
      }

      return {
        success: false,
        error: { message: body.error?.message || 'Registration failed' },
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
      const body = response.data;

      // SECURITY-FIX / DECISION (W-M2): tolerate both nested (`body.data`) and top-level
      // token/user shapes, consistent with login().
      const data = body.data ?? body;

      if (body.success && data.user && data.accessToken) {
        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          onboardingRequired: body.onboardingRequired,
          nextStep: body.nextStep,
        };
      }

      return {
        success: false,
        error: { message: body.error?.message || 'Verification failed' },
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

  /** Sends an SMS code to the signed-in user's phone (QA-AGT-006). */
  async sendPhoneOtp(phone?: string): Promise<SendOtpResponse & { code?: string; retryAfter?: number }> {
    try {
      const response = await apiClient.post<SendOtpResponse>('/auth/phone/send-otp', phone ? { phone } : {});
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          code: error.response?.data?.error?.code,
          retryAfter: error.response?.data?.retryAfter,
          message: error.response?.data?.error?.message || 'Failed to send SMS code',
        };
      }
      return { success: false, message: 'Network error' };
    }
  },

  async verifyPhoneOtp(otp: string): Promise<SendOtpResponse & { code?: string }> {
    try {
      const response = await apiClient.post<SendOtpResponse>('/auth/phone/verify-otp', { otp });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          code: error.response?.data?.error?.code,
          message: error.response?.data?.error?.message || 'Failed to verify code',
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