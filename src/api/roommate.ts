import apiClient from './client';
import type { RoommateProfile, MatchResult } from '../types';

export interface MatchWithUser extends MatchResult {
  id: string;
  fullName?: string;
  avatar?: string;
  aInterested?: boolean;
  bInterested?: boolean;
  contactReleasedAt?: string;
  createdAt: string;
}

export interface MatchesResponse {
  success: boolean;
  data?: {
    matches: MatchWithUser[];
    total: number;
    aiPowered?: boolean;
  };
  error?: { code: string; message: string };
}

export interface RequestResponse {
  success: boolean;
  data?: {
    requests: Array<{
      id: string;
      fromUserId: { _id: string; fullName: string; avatar: string };
      toUserId: { _id: string; fullName: string; avatar: string };
      status: string;
      createdAt: string;
    }>;
    total: number;
  };
  error?: { code: string; message: string };
}

export const roommateApi = {
  // Profile management
  async createProfile(profileData: Partial<RoommateProfile>): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const response = await apiClient.post('/roommate/profile', profileData);
      return response.data as { success: boolean; data?: any; error?: any };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to create profile' }
      };
    }
  },

  async getProfile(): Promise<{ success: boolean; data?: RoommateProfile; error?: any }> {
    try {
      const response = await apiClient.get('/roommate/profile');
      return response.data as { success: boolean; data?: RoommateProfile; error?: any };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to fetch profile' }
      };
    }
  },

  async updateProfile(profileData: Partial<RoommateProfile>): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const response = await apiClient.put('/roommate/profile', profileData);
      return response.data as { success: boolean; data?: any; error?: any };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to update profile' }
      };
    }
  },

  // AI-powered matching
  async getMatches(page = 1, limit = 20): Promise<MatchesResponse> {
    try {
      const response = await apiClient.get(`/roommate/matches?page=${page}&limit=${limit}`);
      return response.data as MatchesResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to fetch matches' }
      };
    }
  },

  async getMatchById(matchId: string): Promise<{
    success: boolean;
    data?: MatchWithUser;
    error?: any
  }> {
    try {
      const response = await apiClient.get(`/roommate/matches/${matchId}`);
      return response.data as { success: boolean; data?: MatchWithUser; error?: any };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to fetch match' }
      };
    }
  },

  async getMutualMatches(): Promise<{
    success: boolean;
    data?: { matches: any[]; total: number };
    error?: any
  }> {
    try {
      const response = await apiClient.get('/roommate/matches/mutual');
      return response.data as { success: boolean; data?: { matches: any[]; total: number }; error?: any };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to fetch mutual matches' }
      };
    }
  },

  // Express interest
  async expressInterest(matchId: string): Promise<{
    success: boolean;
    data?: { connected: boolean };
    message?: string;
    error?: any
  }> {
    try {
      const response = await apiClient.post(`/roommate/matches/${matchId}/interest`);
      return response.data as { success: boolean; data?: { connected: boolean }; message?: string; error?: any };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to express interest' }
      };
    }
  },

  // Requests
  async getRequests(): Promise<RequestResponse> {
    try {
      const response = await apiClient.get('/roommate/requests');
      return response.data as RequestResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to fetch requests' }
      };
    }
  },

  async updateRequest(requestId: string, action: 'accept' | 'decline'): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: any
  }> {
    try {
      const response = await apiClient.patch(`/roommate/requests/${requestId}`, { action });
      return response.data as { success: boolean; data?: any; message?: string; error?: any };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || { code: 'SERVER_ERROR', message: 'Failed to update request' }
      };
    }
  },
};

export default roommateApi;
