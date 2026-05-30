import axios from 'axios';
import apiClient from './client';

export interface InitializePaymentRequest {
  tierId: string;
  billingCycle: 'monthly' | 'annually';
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  status: 'success' | 'failed' | 'pending';
  newTier?: string;
  expiresAt?: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  tier?: string;
  reference?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentHistoryResponse {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  totalPaid: number;
}

export const paymentsApi = {
  async initialize(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    try {
      const response = await apiClient.post<{ success: boolean; data: InitializePaymentResponse }>(
        '/payments/initialize',
        request
      );
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to initialize payment');
      }
      throw new Error('Network error');
    }
  },

  async verify(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await apiClient.get<{ success: boolean; data: VerifyPaymentResponse }>(
        `/payments/verify?reference=${reference}`
      );
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to verify payment');
      }
      throw new Error('Network error');
    }
  },

  async getHistory(page = 1, limit = 20, type?: string): Promise<PaymentHistoryResponse> {
    try {
      const response = await apiClient.get<{ success: boolean; data: PaymentHistoryResponse }>(
        `/payments/history?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`
      );
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to fetch payment history');
      }
      throw new Error('Network error');
    }
  },
};

export default paymentsApi;
