import axios from 'axios';
import apiClient from './client';

export interface Inquiry {
  id: string;
  listingId: string;
  listing?: {
    id: string;
    title: string;
    image?: string;
  };
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatar?: string;
    phone?: string;
  };
  question: string;
  replies: InquiryReply[];
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
}

export interface InquiryReply {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    role: string;
  };
  reply: string;
  createdAt: string;
}

interface InquiriesResponse {
  success: boolean;
  data?: {
    inquiries: Inquiry[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
  error?: { message: string };
}

export const inquiriesApi = {
  async getInquiries(listingId?: string, page = 1, limit = 20): Promise<InquiriesResponse> {
    try {
      const response = await apiClient.get<InquiriesResponse>('/inquiries', {
        params: { listingId, page, limit },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to fetch inquiries' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async createInquiry(listingId: string, question: string): Promise<{ success: boolean; data?: Inquiry; error?: { message: string } }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: Inquiry }>('/inquiries', {
        listingId,
        question,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to create inquiry' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },

  async replyToInquiry(inquiryId: string, reply: string): Promise<{ success: boolean; data?: InquiryReply; error?: { message: string } }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: InquiryReply }>(`/inquiries/${inquiryId}/replies`, {
        reply,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: { message: error.response?.data?.error?.message || 'Failed to send reply' },
        };
      }
      return { success: false, error: { message: 'Network error' } };
    }
  },
};

export default inquiriesApi;