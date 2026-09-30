import apiClient from './client';
import { ApiRequestError, getApiError, toApiFailure } from './apiError';
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

      return toApiFailure(body, 'Login failed');
    } catch (error: unknown) {
      // QA-AGT-031: an unverified portal account is refused with 403 EMAIL_NOT_VERIFIED and
      // a `verify_otp` next step. Flattening that to "Login failed" would leave the user
      // staring at what looks like a wrong password with no way forward, so the code, the
      // step and the address all travel with the failure. They arrive in `error.details`
      // (the top-level `email` / `nextStep` mirror is deprecated on the backend).
      const apiError = getApiError(error, 'Login failed');
      const details = (apiError.details ?? {}) as { email?: unknown; nextStep?: unknown };
      return {
        success: false,
        error: { message: apiError.message, code: apiError.code },
        nextStep: typeof details.nextStep === 'string' ? details.nextStep : undefined,
        email: typeof details.email === 'string' ? details.email : undefined,
      };
    }
  },

  /** Redeem the single-use code from a Google redirect for a session. */
  async exchangeGoogleCode(code: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/google/exchange', { code });
      return response.data;
    } catch (error: unknown) {
      return toApiFailure(error, 'Sign-in failed');
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

      return toApiFailure(body, 'Registration failed');
    } catch (error: unknown) {
      return toApiFailure(error, 'Registration failed');
    }
  },

  async sendOtp(email: string): Promise<SendOtpResponse> {
    try {
      const response = await apiClient.post<SendOtpResponse>('/auth/resend-otp', { email });
      return response.data;
    } catch (error: unknown) {
      return toApiFailure(error, 'Failed to send OTP');
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

      return toApiFailure(body, 'Verification failed');
    } catch (error: unknown) {
      return toApiFailure(error, 'Verification failed');
    }
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { email, client: 'web' });
      return response.data;
    } catch (error: unknown) {
      return toApiFailure(error, 'Failed to request password reset');
    }
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>('/auth/reset-password', { email, token, newPassword });
      return response.data;
    } catch (error: unknown) {
      return toApiFailure(error, 'Failed to reset password');
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

  async requestAccountDeletion(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/auth/delete-account/request');
      return response.data;
    } catch (error: unknown) {
      throw new ApiRequestError(getApiError(error, 'Failed to request account deletion'));
    }
  },

  async confirmAccountDeletion(otp: string, confirmText: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>('/auth/delete-account/confirm', { otp, confirmText });
      return response.data;
    } catch (error: unknown) {
      throw new ApiRequestError(getApiError(error, 'Invalid OTP or confirmation'));
    }
  },

  async requestReactivation(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/auth/reactivate/request', { email });
      return response.data;
    } catch (error: unknown) {
      throw new ApiRequestError(getApiError(error, 'Failed to request reactivation'));
    }
  },

  async confirmReactivation(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/reactivate/confirm', { email, otp });
      const body = response.data;
      const data = body.data ?? body;

      if (body.success && data.user && data.accessToken) {
        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          nextStep: body.nextStep,
        };
      }
      return toApiFailure(body, 'Reactivation failed');
    } catch (error: unknown) {
      return toApiFailure(error, 'Invalid code');
    }
  },
};

export default authApi;