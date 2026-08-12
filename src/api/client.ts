import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import API_BASE_URL from './config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      // SECURITY-FIX (CONTRACT/W-H1): send credentials so the backend-set httpOnly
      // refresh cookie is included on requests (esp. /auth/refresh). The refresh token
      // now lives in that cookie, never in localStorage.
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await this.handleRefreshToken();
            if (refreshed) {
              const token = this.getToken();
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client.request(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }

          this.clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        if (error.response?.status === 403) {
          const message = error.response?.data?.error?.message || 'Access denied';
          if (message.toLowerCase().includes('suspend')) {
            this.clearTokens();
            window.location.href = '/suspended';
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    try {
      // SECURITY-FIX (W-H1): only the short-lived access token is read from localStorage;
      // the refresh token is no longer stored here (it lives in an httpOnly cookie).
      // FLAG: the access token still sits in JS-readable storage short-term, so it remains
      // XSS-exposable. Moving it to in-memory-only state is tracked as follow-up hardening.
      const authData = localStorage.getItem('ilesure_web_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.accessToken || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async handleRefreshToken(): Promise<boolean> {
    try {
      // SECURITY-FIX (W-H1/CONTRACT): the refresh token is delivered/stored as a
      // backend-set httpOnly cookie, so we no longer read it from localStorage.
      // withCredentials:true sends that cookie to /auth/refresh.
      const authData = localStorage.getItem('ilesure_web_auth');
      const parsed = authData ? JSON.parse(authData) : null;

      // DECISION: during rollout, if a legacy refresh token is still present in the blob,
      // pass it along for backward-compat; otherwise send an empty body and rely purely on
      // the cookie. Either way the cookie is the source of truth once the backend is live.
      const legacyRefreshToken = parsed?.refreshToken;

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {},
        { withCredentials: true }
      );

      // SECURITY-FIX (W-M2): tolerate both the documented nested shape ({ data: {...} })
      // and the current top-level shape.
      const payload = response.data?.data ?? response.data;
      const accessToken = payload?.accessToken;

      if (accessToken) {
        // SECURITY-FIX (W-H1): persist ONLY the short-lived access token alongside the
        // existing non-sensitive profile. The new refresh token stays in the httpOnly
        // cookie and is never written to localStorage. Strip any legacy refreshToken.
        const newData = { ...(parsed ?? {}), accessToken };
        delete newData.refreshToken;
        localStorage.setItem('ilesure_web_auth', JSON.stringify(newData));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('ilesure_web_auth');
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;