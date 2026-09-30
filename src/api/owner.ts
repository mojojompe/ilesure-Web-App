/**
 * Owner API: the operations an agent and a company share (listings, bookings,
 * inspections, payout subaccount). Role is data here, not a forked module: it picks the
 * endpoint prefix, and every method returns the same `OwnerResult` shape whichever role
 * called it.
 *
 * Two jobs happen at this seam so callers never repeat them:
 *  - errors become `{ success: false, error }` in exactly one place (`toFailure`), carrying
 *    the server's own message/details rather than a generic string;
 *  - listings are normalised (`normalizeListing`) so `rentAnnual` and `price` are always
 *    both present, whichever field the endpoint serialised (root of QA-CO-013).
 */
import apiClient from './client';
import type { Listing, Booking, SharedBooking } from '../types';
import { getApiError } from './apiError';
import type { ApiError } from './apiError';
import type { OwnerDecision } from '../contracts/generated';

export type OwnerRole = 'agent' | 'company';

export interface OwnerError {
  message: string;
  /** `error.details` rendered as display lines, when the server sent a list. */
  details?: string[];
  code?: ApiError['code'];
  status?: number;
}

export type OwnerResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: OwnerError };

/** The subset of the HTTP client this module needs; tests pass a stub. */
export interface OwnerHttp {
  get<T>(url: string): Promise<{ data: T }>;
  post<T>(url: string, data?: unknown): Promise<{ data: T }>;
  put<T>(url: string, data?: unknown): Promise<{ data: T }>;
  delete<T>(url: string): Promise<{ data: T }>;
  upload<T>(url: string, formData: FormData): Promise<{ data: T }>;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/** A listing as callers see it: both price fields always set, both id fields always set. */
export type OwnerListing = Listing & { id: string; price: number; [key: string]: any };

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

export interface SubaccountInfo {
  subaccountCode: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankName?: string | null;
}

export interface SubaccountSetup {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bankName?: string;
}

export type ListingPayload = Record<string, unknown>;

export interface ListingQuery {
  status?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export interface BookingQuery {
  status?: string;
  limit?: number;
  page?: number;
}

export type MarkRentedReason = 'rented_off_platform' | 'rented_on_platform' | 'temporarily_unavailable';

/** Decisions the backend accepts from an owner (bookingLifecycleService OWNER_DECISIONS). */
/** The contract's OWNER_DECISIONS. */
export type BookingDecision = OwnerDecision;

export interface InspectionSchedule {
  inspectionDate: string;
  inspectionTime: string;
  inspectorName?: string;
}

export interface OwnerApi {
  readonly role: OwnerRole;
  getListings(query?: ListingQuery): Promise<OwnerResult<{ listings: OwnerListing[]; pagination?: Pagination }>>;
  getListing(id: string): Promise<OwnerResult<OwnerListing>>;
  createListing(payload: ListingPayload): Promise<OwnerResult<OwnerListing>>;
  updateListing(id: string, payload: ListingPayload): Promise<OwnerResult<OwnerListing | null>>;
  archiveListing(id: string): Promise<OwnerResult<OwnerListing | null>>;
  restoreListing(id: string): Promise<OwnerResult<OwnerListing | null>>;
  markListingRented(id: string, reason?: MarkRentedReason): Promise<OwnerResult<{ listing: OwnerListing | null; pointsAwarded: number }>>;
  /** Soft delete (moves to archive) unless `permanent`. */
  deleteListing(id: string, permanent?: boolean): Promise<OwnerResult<{ permanent: boolean }>>;
  uploadListingImages(listingId: string, files: File[]): Promise<OwnerResult<string[]>>;
  uploadTenancyAgreement(file: File): Promise<OwnerResult<TenancyAgreementDocument>>;
  getBookings(query?: BookingQuery): Promise<OwnerResult<{ bookings: Booking[]; pagination?: Pagination }>>;
  getSharedBookings(query?: BookingQuery): Promise<OwnerResult<{ bookings: SharedBooking[]; pagination?: Pagination }>>;
  decideBooking(bookingId: string, decision: BookingDecision): Promise<OwnerResult<Booking | null>>;
  scheduleInspection(bookingId: string, schedule: InspectionSchedule): Promise<OwnerResult<Booking | null>>;
  markInspectionMissed(bookingId: string): Promise<OwnerResult<Booking | null>>;
  getSubaccount(): Promise<OwnerResult<SubaccountInfo>>;
  setupSubaccount(data: SubaccountSetup): Promise<OwnerResult<SubaccountInfo>>;
}

// ---------------------------------------------------------------------------------------
// Endpoint table. Verified against IleSure_Backend/src/routes/{agent,company}Routes.ts.
// ---------------------------------------------------------------------------------------

interface Endpoints {
  listings: string;
  listing: (id: string) => string;
  deleteListing: (id: string) => string;
  bookings: string;
  sharedBookings: string;
  booking: (id: string) => string;
  subaccount: string;
  /** The endpoint ignores ?status/?search, so the module filters the page it gets back. */
  filtersListingsLocally: boolean;
}

const ENDPOINTS: Record<OwnerRole, Endpoints> = {
  agent: {
    listings: '/agent/listings',
    listing: (id) => `/agent/listings/${id}`,
    deleteListing: (id) => `/agent/listings/${id}`,
    bookings: '/agent/bookings',
    sharedBookings: '/agent/shared-bookings',
    booking: (id) => `/agent/bookings/${id}`,
    subaccount: '/agent/subaccount',
    filtersListingsLocally: false,
  },
  company: {
    listings: '/company/listings',
    // No GET /company/listings/:id; the public detail route is what company pages used.
    listing: (id) => `/listings/${id}`,
    // No DELETE /company/listings/:id. The /agent route is mounted behind
    // agentOrCompanyMiddleware and its ownership filter accepts the caller's companyId
    // (agentController.listingOwnershipFilter), the same shared-handler arrangement
    // LL-P0-4 used for archive/restore.
    deleteListing: (id) => `/agent/listings/${id}`,
    bookings: '/company/bookings',
    sharedBookings: '/company/shared-bookings',
    booking: (id) => `/company/bookings/${id}`,
    subaccount: '/company/subaccount',
    // companyController.getListings reads only page/limit.
    filtersListingsLocally: true,
  },
};

// ---------------------------------------------------------------------------------------
// Pure helpers (exported for tests and for callers holding raw listings).
// ---------------------------------------------------------------------------------------

/**
 * Converts anything thrown by the HTTP layer into an OwnerError. The one place this happens;
 * the reading itself is `getApiError`, shared with every other API module.
 */
export function toFailure(err: unknown, fallback: string): { success: false; error: OwnerError } {
  const { code, message, details, status } = getApiError(err, fallback);
  const lines = detailLines(details);
  return {
    success: false,
    error: {
      message,
      ...(lines ? { details: lines } : {}),
      code,
      ...(status !== undefined ? { status } : {}),
    },
  };
}

/**
 * `error.details` as display lines, when it is a list: field errors arrive as
 * `{ field, message }` objects (VALIDATION_ERROR), older rejections as plain strings.
 */
function detailLines(details: unknown): string[] | undefined {
  if (!Array.isArray(details)) return undefined;
  const lines = details
    .map((d) => {
      if (typeof d === 'string') return d;
      if (d && typeof d === 'object' && typeof (d as { message?: unknown }).message === 'string') {
        const { field, message } = d as { field?: unknown; message: string };
        return typeof field === 'string' && field ? `${field}: ${message}` : message;
      }
      return '';
    })
    .filter(Boolean);
  return lines.length ? lines : undefined;
}

/** Both price fields and both id fields, whichever the endpoint serialised. */
export function normalizeListing<T extends Record<string, any>>(raw: T): OwnerListing {
  const amount = Number(raw.rentAnnual ?? raw.annualRent ?? raw.price ?? 0) || 0;
  const id = String(raw._id ?? raw.id ?? '');
  return { ...(raw as any), _id: id, id, rentAnnual: amount, price: amount };
}

export function filterListings(listings: OwnerListing[], query?: ListingQuery): OwnerListing[] {
  const term = query?.search?.trim().toLowerCase();
  return listings.filter((l) => {
    if (query?.status && l.status !== query.status) return false;
    if (term) {
      const haystack = [l.title, l.description, l.address, l.city, l.areaCluster, l.landmark]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** Unwraps a `{ success, data, message }` envelope; a `success: false` body is a failure too. */
function unwrap<T>(body: any, fallback: string, pick: (body: any) => T): OwnerResult<T> {
  if (body && body.success === false) {
    return toFailure({ response: { data: body } }, fallback);
  }
  return { success: true, data: pick(body), ...(body?.message ? { message: body.message } : {}) };
}

// ---------------------------------------------------------------------------------------

export function createOwnerApi(role: OwnerRole, http: OwnerHttp = apiClient): OwnerApi {
  const ep = ENDPOINTS[role];

  async function call<T>(fallback: string, request: () => Promise<{ data: any }>, pick: (body: any) => T): Promise<OwnerResult<T>> {
    try {
      const response = await request();
      return unwrap(response.data, fallback, pick);
    } catch (err) {
      return toFailure(err, fallback);
    }
  }

  const listingOrNull = (body: any) => {
    const raw = body?.data?.listing ?? body?.data;
    return raw && typeof raw === 'object' ? normalizeListing(raw) : null;
  };

  return {
    role,

    getListings(query) {
      const qs = ep.filtersListingsLocally
        ? toQueryString({ limit: query?.limit, page: query?.page })
        : toQueryString({ status: query?.status, search: query?.search, limit: query?.limit, page: query?.page });
      return call('Failed to fetch listings', () => http.get(`${ep.listings}${qs}`), (body) => {
        const listings = ((body?.data?.listings ?? []) as any[]).map(normalizeListing);
        return {
          listings: ep.filtersListingsLocally ? filterListings(listings, query) : listings,
          pagination: body?.data?.pagination,
        };
      });
    },

    async getListing(id) {
      const result = await call('Failed to fetch listing', () => http.get(ep.listing(id)), listingOrNull);
      if (result.success && !result.data) return { success: false, error: { message: 'Listing not found' } };
      return result as OwnerResult<OwnerListing>;
    },

    async createListing(payload) {
      const result = await call('Failed to create listing', () => http.post(ep.listings, payload), listingOrNull);
      if (result.success && !result.data) return { success: false, error: { message: 'Listing was not returned by the server' } };
      return result as OwnerResult<OwnerListing>;
    },

    updateListing(id, payload) {
      return call('Failed to update listing', () => http.put(`${ep.listings}/${id}`, payload), listingOrNull);
    },

    archiveListing(id) {
      return call('Failed to archive listing', () => http.put(`${ep.listings}/${id}/archive`), listingOrNull);
    },

    restoreListing(id) {
      return call('Failed to restore listing', () => http.put(`${ep.listings}/${id}/restore`), listingOrNull);
    },

    markListingRented(id, reason = 'rented_off_platform') {
      return call(
        'Failed to mark listing as rented',
        () => http.put(`${ep.listings}/${id}/mark-rented`, { reason }),
        (body) => ({ listing: listingOrNull(body), pointsAwarded: Number(body?.pointsAwarded) || 0 })
      );
    },

    deleteListing(id, permanent = false) {
      const url = permanent ? `${ep.deleteListing(id)}?permanent=true` : ep.deleteListing(id);
      return call(
        permanent ? 'Failed to permanently delete listing' : 'Failed to delete listing',
        () => http.delete(url),
        (body) => ({ permanent: Boolean(body?.permanent ?? permanent) })
      );
    },

    uploadListingImages(listingId, files) {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      return call('Failed to upload photos', () => http.upload(`/listings/${listingId}/images`, formData), (body) => body?.data ?? []);
    },

    uploadTenancyAgreement(file) {
      const formData = new FormData();
      formData.append('document', file);
      return call('Could not upload the tenancy agreement. Please try again.', () => http.upload('/listings/tenancy-agreement', formData), (body) => body?.data);
    },

    getBookings(query) {
      const qs = toQueryString({ status: query?.status, limit: query?.limit, page: query?.page });
      return call('Failed to fetch bookings', () => http.get(`${ep.bookings}${qs}`), (body) => ({
        bookings: body?.data?.bookings ?? [],
        pagination: body?.data?.pagination,
      }));
    },

    getSharedBookings(query) {
      const qs = toQueryString({ status: query?.status, limit: query?.limit, page: query?.page });
      return call('Failed to fetch shared bookings', () => http.get(`${ep.sharedBookings}${qs}`), (body) => ({
        bookings: body?.data?.bookings ?? [],
        pagination: body?.data?.pagination,
      }));
    },

    decideBooking(bookingId, decision) {
      return call('Failed to update booking', () => http.put(ep.booking(bookingId), { status: decision }), (body) => body?.data ?? null);
    },

    scheduleInspection(bookingId, schedule) {
      return call('Failed to schedule viewing', () => http.post(`/bookings/${bookingId}/inspection`, schedule), (body) => body?.data ?? null);
    },

    markInspectionMissed(bookingId) {
      return call(
        'Failed to mark the inspection as missed',
        () => http.post(`/bookings/${bookingId}/inspection/missed`),
        (body) => body?.data ?? null
      );
    },

    getSubaccount() {
      return call('Failed to fetch subaccount', () => http.get(ep.subaccount), (body) => body?.data);
    },

    setupSubaccount(data) {
      return call('Failed to setup subaccount', () => http.post(ep.subaccount, data), (body) => body?.data);
    },
  };
}

const instances: Partial<Record<OwnerRole, OwnerApi>> = {};

/** The app's owner API for a role, bound to the shared HTTP client. */
export function ownerApi(role: OwnerRole): OwnerApi {
  return (instances[role] ??= createOwnerApi(role));
}

export default ownerApi;
