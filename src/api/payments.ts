import apiClient from './client';
import { getApiError, ApiRequestError } from './apiError';

export interface InitializePaymentRequest {
  tierId: string;
  billingCycle: 'monthly' | 'annually';
  callbackUrl?: string;
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  status: 'success' | 'failed' | 'pending';
  newTier?: string;
  type?: string;
  bookingId?: string;
  expiresAt?: string;
  amount?: number;
  reference?: string;
  /** Newer backends echo the purchased cycle; older ones do not. */
  billingCycle?: 'monthly' | 'annually';
}

/**
 * The tier purchase this browser started, kept so the Paystack callback knows which
 * billing cycle was bought (the verify response has not always included it, and the
 * callback used to write 'monthly' into the user even after an annual purchase).
 */
export interface PendingTierPurchase {
  tierId: string;
  billingCycle: 'monthly' | 'annually';
  reference?: string;
  startedAt: number;
}

const PENDING_PURCHASE_KEY = 'pendingTierPurchase';

export function savePendingTierPurchase(p: PendingTierPurchase): void {
  try { localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

export function readPendingTierPurchase(): PendingTierPurchase | null {
  try {
    const raw = localStorage.getItem(PENDING_PURCHASE_KEY);
    return raw ? (JSON.parse(raw) as PendingTierPurchase) : null;
  } catch {
    return null;
  }
}

export function clearPendingTierPurchase(): void {
  try { localStorage.removeItem(PENDING_PURCHASE_KEY); } catch { /* storage unavailable */ }
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

export interface Bank {
  name: string;
  code: string;
  slug: string;
  longcode: string;
}

export interface ResolveAccountResult {
  accountNumber: string;
  accountName: string;
}

export const paymentsApi = {
  async listBanks(): Promise<Bank[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Bank[] }>('/payments/banks');
      return response.data.data;
    } catch {
      return [];
    }
  },

  async resolveAccount(accountNumber: string, bankCode: string): Promise<ResolveAccountResult> {
    try {
      const response = await apiClient.post<{ success: boolean; data: ResolveAccountResult }>(
        '/payments/resolve-account',
        { accountNumber, bankCode }
      );
      return response.data.data;
    } catch (error) {
      throw new ApiRequestError(getApiError(error, 'Failed to resolve account'));
    }
  },
  async initialize(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    try {
      const callbackUrl =
        request.callbackUrl ||
        (typeof window !== 'undefined' ? `${window.location.origin}/payment/callback` : undefined);
      const response = await apiClient.post<{ success: boolean; data: InitializePaymentResponse }>(
        '/payments/initialize',
        { ...request, callbackUrl }
      );
      savePendingTierPurchase({
        tierId: request.tierId,
        billingCycle: request.billingCycle,
        reference: response.data.data?.reference,
        startedAt: Date.now(),
      });
      return response.data.data;
    } catch (error) {
      throw new ApiRequestError(getApiError(error, 'Failed to initialize payment'));
    }
  },

  async verify(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await apiClient.get<{ success: boolean; data: VerifyPaymentResponse }>(
        `/payments/verify?reference=${reference}`
      );
      return response.data.data;
    } catch (error) {
      throw new ApiRequestError(getApiError(error, 'Failed to verify payment'));
    }
  },

  async getHistory(page = 1, limit = 20, type?: string): Promise<PaymentHistoryResponse> {
    try {
      const response = await apiClient.get<{ success: boolean; data: PaymentHistoryResponse }>(
        `/payments/history?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`
      );
      return response.data.data;
    } catch (error) {
      throw new ApiRequestError(getApiError(error, 'Failed to fetch payment history'));
    }
  },
};

export default paymentsApi;
