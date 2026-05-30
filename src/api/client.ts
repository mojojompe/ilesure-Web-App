import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import API_BASE_URL from './config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
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
      const authData = localStorage.getItem('ilesure_web_auth');
      if (!authData) return false;

      const parsed = JSON.parse(authData);
      const refreshToken = parsed.refreshToken;
      if (!refreshToken) return false;

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      if (accessToken && newRefreshToken) {
        const newData = { ...parsed, accessToken, refreshToken: newRefreshToken };
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