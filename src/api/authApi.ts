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
  /** QA-AGT-031: the address to verify, echoed back on an EMAIL_NOT_VERIFIED challenge. */
  email?: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: {
    message: string;
    /** Machine-readable reason, so callers branch on the code rather than the prose. */
    code?: string;
  };
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  referrerCode?: string;
  companyName?: string;
  cacNumber?: string;
  idCardUrl?: string;
  ninUrl?: string;
  companyDocUrl?: string;
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
        error: { message: body.error?.message || 'Login failed', code: body.error?.code },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // QA-AGT-031: an unverified portal account is refused with 403 EMAIL_NOT_VERIFIED and
        // a `verify_otp` next step. Flattening that to "Login failed" would leave the user
        // staring at what looks like a wrong password with no way forward, so the code, the
        // step and the address all travel with the failure.
        const body = error.response?.data;
        return {
          success: false,
          error: {
            message: body?.error?.message || 'Login failed',
            code: body?.error?.code,
          },
          nextStep: body?.nextStep,
          email: body?.email,
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  /** Redeem the single-use code from a Google redirect for a session. */
  async exchangeGoogleCode(code: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/google/exchange', { code });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data;
        return { success: false, error: { message: body?.error?.message || 'Sign-in failed', code: body?.error?.code } };
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

  // REMOVED: uploadDoc(), it posted to POST /auth/upload-doc, an unauthenticated
  // upload endpoint serving the individual-document KYC flow that Dojah's NIN/BVN
  // verification replaced. It had no callers anywhere in the app, and the endpoint has
  // been removed from the backend.

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },
};

export default authApi;