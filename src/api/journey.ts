import apiClient from './client';

export interface PublicJourneyData {
  status: 'en_route' | 'arrived' | 'cancelled' | 'timed_out';
  startedAt: string;
  arrivedAt?: string;
  currentLocation?: [number, number]; // [lng, lat]
  destinationLocation?: [number, number]; // [lng, lat]
  destinationAddress?: string;
  propertyTitle: string;
  propertyArea: string;
  travelerName: string;
  distanceRemainingMeters?: number;
  etaMinutes?: number;
  lastUpdated: string;
}

export const journeyApi = {
  /** Public tracking data for family/guardians */
  async getPublicJourney(shareToken: string): Promise<{ success: boolean; data?: PublicJourneyData; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: PublicJourneyData }>(
        `/journey/public/${shareToken}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: { message: error?.response?.data?.error?.message || 'Failed to load tracking session' },
      };
    }
  },

  /** Get active journey for a booking */
  async getActiveJourney(bookingId: string): Promise<{ success: boolean; data?: any; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/bookings/${bookingId}/journey/active`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: { message: error?.response?.data?.error?.message || 'No active journey found' },
      };
    }
  },
};

export default journeyApi;
