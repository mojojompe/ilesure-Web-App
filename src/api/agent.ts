import apiClient from './client';
import type { Listing, Booking, SharedBooking } from '../types';

interface DashboardResponse {
  success: boolean;
  data?: {
    overview: {
      totalListings: number;
      activeListings: number;
      totalBookings: number;
      monthlyRevenue: number;
      totalViews: number;
      totalSaves: number;
      totalInquiries: number;
      trends: {
        listings: number;
        bookings: number;
        revenue: number;
      };
    };
    recentListings: Listing[];
    recentBookings: Booking[];
  };
  error?: { message: string };
}

interface ListingsResponse {
  success: boolean;
  data?: {
    listings: Listing[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
  error?: { message: string };
}

interface ListingResponse {
  success: boolean;
  data?: {
    listing: Listing;
    message?: string;
  };
  error?: { message: string };
}

interface ShortletRateData {
  id?: string;
  label: string;
  durationValue: number;
  durationUnit: 'hour' | 'day' | 'week' | 'month';
  price: number;
}

/**
 * A tenancy agreement PDF supplied by the lister for a specific property.
 * When present it replaces the platform template in the tenant's signing flow.
 */
export interface TenancyAgreementDocument {
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  pageCount?: number;
}

interface CreateListingData {
  title: string;
  description: string;
  propertyType: string;
  rentAnnual: number;
  cautionFee?: number;
  agencyFee?: number;
  address: string;
  city: string;
  state?: string;
  landmark?: string;
  areaCluster: string;
  distanceBucket: string;
  maxOccupants: number;
  genderRestriction: string;
  furnishing: string;
  power: string;
  water: string;
  amenities?: string[];
  rules?: string[];
  images?: string[];
  // Pricing / lease term
  paymentFrequency?: string;
  customPaymentPlan?: { installments: number; interval: string; amountPerInstallment: number };
  leaseDuration?: string;
  leaseDurationValue?: number;
  leaseDurationUnit?: 'year' | 'month';
  additionalNotes?: string;
  // Flexible custom shortlet tiers (+ legacy fixed pricing for back-compat)
  shortletRates?: ShortletRateData[];
  shortletPricing?: { hourly?: number; daily?: number; weekly?: number; monthly?: number };
  minStay?: number;
  minStayUnit?: 'hour' | 'day' | 'week' | 'month';
  maxStay?: number;
  maxStayUnit?: 'hour' | 'day' | 'week' | 'month';
  inspectionAvailability?: { availableDays?: string[]; timeSlots?: string[]; notes?: string };
  tenancyAgreement?: TenancyAgreementDocument | null;
}

interface BookingsResponse {
  success: boolean;
  data?: {
    bookings: Booking[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
  error?: { message: string };
}

interface SharedBookingsResponse {
  success: boolean;
  data?: {
    bookings: SharedBooking[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
  error?: { message: string };
}

interface BookingResponse {
  success: boolean;
  data?: Booking;
  error?: { message: string };
}

export interface SubaccountInfo {
  subaccountCode: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankName?: string | null;
}

export const agentApi = {
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const response = await apiClient.get<DashboardResponse>('/agent/dashboard');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch dashboard' } };
    }
  },

  async getListings(params?: { status?: string; search?: string; limit?: number; page?: number }): Promise<ListingsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<ListingsResponse>(`/agent/listings${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch listings' } };
    }
  },

  async getListing(id: string): Promise<ListingResponse> {
    try {
      const response = await apiClient.get<ListingResponse>(`/agent/listings/${id}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch listing' } };
    }
  },

  async createListing(data: CreateListingData): Promise<ListingResponse> {
    try {
      const response = await apiClient.post<ListingResponse>('/agent/listings', data);
      return response.data;
    } catch (err: any) {
      // BUGFIX (QA-AGT-010): a bare `catch {}` discarded the server's real reason and
      // returned a generic string. Combined with the caller having no `else` branch,
      // a 400 produced COMPLETELY silent failure — the Publish button just stopped
      // spinning. Propagate the API's message and field details so the wizard can
      // show the user what is actually wrong.
      const apiError = err?.response?.data?.error;
      return {
        success: false,
        error: {
          message: apiError?.message || 'Failed to create listing',
          details: apiError?.details,
        },
      } as ListingResponse;
    }
  },

  /**
   * Uploads a tenancy agreement PDF and returns its stored metadata.
   *
   * Not tied to a listing id: the wizard collects the document before the listing
   * exists, so the returned metadata is sent back in the create payload.
   */
  async uploadTenancyAgreement(file: File): Promise<TenancyAgreementDocument> {
    const formData = new FormData();
    formData.append('document', file);
    const response = await apiClient.upload<{ success: boolean; data: TenancyAgreementDocument }>(
      '/listings/tenancy-agreement',
      formData
    );
    return response.data.data;
  },

  async uploadImages(listingId: string, formData: FormData): Promise<string[]> {
    const response = await apiClient.upload<{ success: boolean; data: string[] }>(`/listings/${listingId}/images`, formData);
    return response.data.data;
  },

  async updateListing(id: string, data: Partial<CreateListingData & { status: string }>): Promise<ListingResponse> {
    try {
      const response = await apiClient.put<ListingResponse>(`/agent/listings/${id}`, data);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to update listing' } };
    }
  },

  async archiveListing(id: string): Promise<ListingResponse> {
    try {
      const response = await apiClient.put<ListingResponse>(`/agent/listings/${id}/archive`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to archive listing' } };
    }
  },

  async markListingRented(id: string, reason = 'rented_off_platform'): Promise<ListingResponse & { pointsAwarded?: number }> {
    try {
      const response = await apiClient.put<ListingResponse & { pointsAwarded?: number }>(`/agent/listings/${id}/mark-rented`, { reason });
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to mark listing as rented' } };
    }
  },

  async restoreListing(id: string): Promise<ListingResponse> {
    try {
      const response = await apiClient.put<ListingResponse>(`/agent/listings/${id}/restore`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to restore listing' } };
    }
  },

  async deleteListing(id: string, permanent = false): Promise<{ success: boolean; permanent?: boolean; message?: string }> {
    try {
      const url = permanent ? `/agent/listings/${id}?permanent=true` : `/agent/listings/${id}`;
      const response = await apiClient.delete<{ success: boolean; permanent?: boolean; message?: string }>(url);
      return response.data;
    } catch {
      return { success: false, message: 'Failed to delete listing' };
    }
  },

  async getBookings(params?: { status?: string; limit?: number; page?: number }): Promise<BookingsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<BookingsResponse>(`/agent/bookings${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch bookings' } };
    }
  },

  async getSubaccount(): Promise<{ success: boolean; data?: SubaccountInfo; error?: { message: string } }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: SubaccountInfo }>('/agent/subaccount');
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch subaccount' } };
    }
  },

  async setupSubaccount(data: { businessName: string; bankCode: string; accountNumber: string; accountName: string; bankName?: string }): Promise<{ success: boolean; data?: SubaccountInfo; message?: string; error?: { message: string } }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: SubaccountInfo; message?: string }>('/agent/subaccount', data);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to setup subaccount' } };
    }
  },

  async updateBookingStatus(bookingId: string, status: string, listingId: string): Promise<BookingResponse> {
    try {
      const response = await apiClient.patch<BookingResponse>(
        `/listings/${listingId}/bookings/${bookingId}/status`,
        { status }
      );
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to update booking' } };
    }
  },

  /** Record that a scheduled viewing did not happen (agent/landlord only). */
  async markInspectionMissed(bookingId: string): Promise<BookingResponse> {
    try {
      const response = await apiClient.post<BookingResponse>(`/bookings/${bookingId}/inspection/missed`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: { message: error?.response?.data?.error?.message || 'Failed to mark the inspection as missed' },
      };
    }
  },

  /** Schedule or reschedule an inspection viewing. */
  async scheduleInspection(bookingId: string, data: { inspectionDate: string; inspectionTime: string; inspectorName?: string }): Promise<BookingResponse> {
    try {
      const response = await apiClient.post<BookingResponse>(`/bookings/${bookingId}/inspection`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: { message: error?.response?.data?.error?.message || 'Failed to schedule viewing' },
      };
    }
  },

  async getSharedBookings(params?: { status?: string; limit?: number; page?: number }): Promise<SharedBookingsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.page) searchParams.set('page', String(params.page));

      const queryString = searchParams.toString();
      const response = await apiClient.get<SharedBookingsResponse>(`/agent/shared-bookings${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch {
      return { success: false, error: { message: 'Failed to fetch shared bookings' } };
    }
  },
};

export default agentApi;