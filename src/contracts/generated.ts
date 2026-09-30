// GENERATED — do not edit; run contracts:sync in IleSure_Backend
// Source: IleSure_Backend/src/contracts/apiContract.ts (copied verbatim below).
/* eslint-disable */

/**
 * iléSure API contract: the client-facing vocabulary and response types, in one file.
 *
 * This file is the single source. The backend imports its enums and constants from here, and
 * `npm run contracts:sync` copies it VERBATIM (plus a "generated" header) into every client
 * repo as `src/contracts/generated.ts`, so the backend and all four clients compile against
 * byte-identical source. `npm run contracts:check` fails when any client copy is stale.
 *
 * RULES FOR EDITING (the copy step depends on them):
 *  - No imports of any kind. Everything the file needs lives in the file.
 *  - Plain TypeScript only: `as const` arrays, records, interfaces, type aliases and small
 *    pure functions. No `enum`, no `namespace`, nothing that needs a runtime dependency or a
 *    particular tsconfig flag, so every client (Vite, CRA-style, React Native) accepts it.
 *  - Additive changes are safe. Renaming or removing a value is a breaking API change for
 *    shipped clients; treat it like one.
 */

// ── Envelope ──────────────────────────────────────────────────────────────────────────────

/**
 * The shape of EVERY error response the API sends, from every controller and middleware.
 * `code` is stable and machine-readable (see ERROR_CODES); `message` is human-readable and is
 * shown to users by the clients; `details` is optional structured context (field errors, the
 * offending user id, retry hints).
 */
export interface ApiErrorBody {
  code: ErrorCode | (string & {});
  message: string;
  details?: unknown;
}

export interface ErrorEnvelope {
  success: false;
  error: ApiErrorBody;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T> = SuccessEnvelope<T> | ErrorEnvelope;

/** Narrowing helper usable on any parsed response body. */
export function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  if (!body || typeof body !== 'object') return false;
  const b = body as { success?: unknown; error?: unknown };
  if (b.success !== false || !b.error || typeof b.error !== 'object') return false;
  const e = b.error as { code?: unknown; message?: unknown };
  return typeof e.code === 'string' && typeof e.message === 'string';
}

/**
 * Every error code the API emits. Clients may switch on these; the backend test suite fails
 * when a controller emits a literal code that is missing from this list.
 */
export const ERROR_CODES = [
  // generic, chosen by HTTP status
  'BAD_REQUEST',
  'VALIDATION',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'DUPLICATE_FIELD',
  'PAYLOAD_TOO_LARGE',
  'FILE_TOO_LARGE',
  'INVALID_UPLOAD',
  'UPLOAD_ERROR',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'INTERNAL_ERROR',
  'BAD_GATEWAY',
  'MAINTENANCE_MODE',
  'PROVIDER_UNAVAILABLE',
  // auth and account
  'ACCOUNT_LOCKED',
  'ACCOUNT_SUSPENDED',
  // soft-deleted account; emitted by main's account-deletion flow (clients route to reactivation)
  'ACCOUNT_DELETED',
  'EMAIL_NOT_VERIFIED',
  'EMAIL_DELIVERY_FAILED',
  'GOOGLE_EMAIL_UNVERIFIED',
  'FORBIDDEN_ROLE',
  'INVALID_CODE',
  'INVALID_OTP',
  'INVALID_PASSWORD',
  'INVALID_TOKEN',
  'NO_ACCOUNT',
  'NO_COMPANY',
  'OTP_EXPIRED',
  'PHONE_IN_USE',
  'REGISTRATION_DISABLED',
  'RESEND_TOO_SOON',
  'TOO_MANY_ATTEMPTS',
  'USER_NOT_FOUND',
  // identity verification / KYC
  'ALREADY_VERIFIED',
  'BVN_REQUIRED',
  'DOJAH_ERROR',
  'KYC_REQUIRED',
  'NAME_MISMATCH',
  'NOT_VERIFIED',
  'VERIFICATION_FAILED',
  'VERIFICATION_NOT_FOUND',
  'VERIFICATION_PENDING',
  'VERIFICATION_REQUIRED',
  // listings
  'FEE_NOT_APPLICABLE_TO_SHORTLET',
  'INVALID_IMAGE_PAYLOAD',
  'IN_USE',
  'LISTING_FULLY_BOOKED',
  'LISTING_NOT_FOUND',
  'LISTING_NOT_PRICED',
  'LISTING_NOT_SHAREABLE',
  'LISTING_REQUIRED',
  'LISTING_UNAVAILABLE',
  'NOT_BOOKABLE',
  'TIER_LIMIT_REACHED',
  'TIER_RESTRICTED',
  // bookings and inspections
  'ABOVE_MAX_STAY',
  'ALREADY_CONFIRMED',
  'BELOW_MIN_STAY',
  'BOOKING_REFUNDED',
  'CONTRACT_NOT_SIGNED',
  'DATES_UNAVAILABLE',
  'DUPLICATE_BOOKING',
  'INSPECTION_NOT_SCHEDULED',
  'INSPECTION_NOT_VERIFIED',
  'INVALID_ACTION',
  'INVALID_QUANTITY',
  'INVALID_START_DATE',
  'INVALID_STATUS',
  'INVALID_TRANSITION',
  'NOT_CANCELLABLE',
  'NO_SHORTLET_RATE',
  'OUT_OF_ORDER',
  'QUANTITY_TOO_LARGE',
  'START_DATE_IN_PAST',
  'TENANCY_STARTED',
  // shared bookings and roommates
  'ALREADY_JOINED',
  'LEGACY_SHARED_BOOKING',
  'MATCH_NOT_CONNECTED',
  'MATCH_NOT_FOUND',
  'MUST_COMMUNICATE',
  'NOT_A_PARTICIPANT',
  'NOT_ENOUGH_SLOTS',
  'PARTICIPANT_ALREADY_BOOKED',
  'PARTICIPANT_NOT_ELIGIBLE',
  'SHARED_BOOKING_EXISTS',
  'SHARED_BOOKING_NOT_FOUND',
  'SHORTLET_NOT_SHAREABLE',
  // payments and tiers
  'ACTIVE_PLAN_EXISTS',
  'ALREADY_PAID',
  'INVALID_AMOUNT',
  'INVALID_PAYMENT_EMAIL',
  'NO_REFERENCE',
  'NOT_PAYABLE',
  'NOT_YET_PAYABLE',
  'PAYMENT_INIT_REJECTED',
  'PAYMENT_MISMATCH',
  'PAYSTACK_ERROR',
  'PRICE_UNAVAILABLE',
  'REFERENCE_MISMATCH',
  'REFUND_FAILED',
  'RESOLVE_ERROR',
  // chat, calls, reviews, maps
  'ALREADY_REVIEWED',
  'CALL_ERROR',
  'INVALID_CHAT_ID',
  'MAPS_LOOKUP_FAILED',
  // admin and platform
  'EMAIL_DISPATCH_FAILED',
  'INVALID_LIMIT',
  'INVALID_PAGE',
  'NO_RECIPIENTS',
  'WAITLIST_DISABLED',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// ── Users and accounts ────────────────────────────────────────────────────────────────────

export const USER_ROLES = [
  'student',
  'individual',
  'landlord',
  'agent',
  'company',
  'company_admin',
  'sub_agent',
  'admin',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles a client may request at self-registration (everything except `admin`). */
export const SELF_REGISTRATION_ROLES = [
  'student',
  'individual',
  'landlord',
  'agent',
  'company',
  'company_admin',
  'sub_agent',
] as const satisfies readonly UserRole[];

/** Roles that list property (the portal / web app audience). */
export const LISTER_ROLES = ['landlord', 'agent', 'company', 'company_admin', 'sub_agent'] as const satisfies readonly UserRole[];

/** Roles that rent (the PWA / mobile audience). */
export const RENTER_ROLES = ['student', 'individual'] as const satisfies readonly UserRole[];

// 'deleted' is a soft-deleted account awaiting reactivation (/auth/reactivate/*).
export const ACCOUNT_STATUSES = ['active', 'pending', 'suspended', 'inactive', 'deleted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** KYC review state of a user (`User.verificationStatus`). */
export const VERIFICATION_STATUSES = ['pending', 'verified', 'more_info', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending review',
  verified: 'Verified',
  more_info: 'More information requested',
  rejected: 'Rejected',
};

export const COMPANY_STATUSES = ['pending', 'verified', 'rejected', 'suspended'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

// ── Listings ──────────────────────────────────────────────────────────────────────────────
// Canonical stored values. Labels are display leaves only; never store a label.

export const PROPERTY_TYPES = [
  'self_con',
  '1_bed',
  '2_bed',
  '3_bed',
  'mini_flat',
  'studio',
  'penthouse',
  'hostel_room',
  'shared_apartment',
  'shortlet',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const FURNISHINGS = ['fully_furnished', 'semi_furnished', 'unfurnished'] as const;
export type Furnishing = (typeof FURNISHINGS)[number];

export const POWER_SOURCES = ['constant', 'gen_dependent', 'solar_backed', 'hybrid'] as const;
export type PowerSource = (typeof POWER_SOURCES)[number];

export const WATER_SOURCES = ['borehole', 'public', 'tank'] as const;
export type WaterSource = (typeof WATER_SOURCES)[number];

export const GENDER_RESTRICTIONS = ['any', 'male_only', 'female_only', 'mixed'] as const;
export type GenderRestriction = (typeof GENDER_RESTRICTIONS)[number];

export const DISTANCE_BUCKETS = ['very_close', 'close', 'budget_stretch'] as const;
export type DistanceBucket = (typeof DISTANCE_BUCKETS)[number];

/**
 * Canonical amenity tokens. `Listing.amenities` is a free-form string[]: known amenities are
 * stored as these tokens, anything else is kept as the lister's own wording.
 */
export const AMENITIES = [
  'wifi',
  'air_conditioning',
  'kitchen',
  'water_heater',
  'tv',
  'washing_machine',
  'refrigerator',
  'workspace',
  'parking',
  'security',
  'cctv',
  'gated_estate',
  'balcony',
  'swimming_pool',
  'gym',
  'elevator',
  'prepaid_meter',
  'wardrobe',
  'ensuite_bathroom',
  'generator',
] as const;
export type Amenity = (typeof AMENITIES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  self_con: 'Self-con',
  '1_bed': '1-Bedroom',
  '2_bed': '2-Bedroom',
  '3_bed': '3-Bedroom',
  mini_flat: 'Mini Flat',
  studio: 'Studio',
  penthouse: 'Penthouse',
  hostel_room: 'Hostel Room',
  shared_apartment: 'Shared Apartment',
  shortlet: 'Shortlet',
};

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  fully_furnished: 'Fully Furnished',
  semi_furnished: 'Semi-Furnished',
  unfurnished: 'Unfurnished',
};

export const POWER_LABELS: Record<PowerSource, string> = {
  constant: 'Constant PHCN',
  gen_dependent: 'Gen Backup',
  solar_backed: 'Solar-Backed',
  hybrid: 'Hybrid',
};

export const WATER_LABELS: Record<WaterSource, string> = {
  borehole: 'Borehole',
  public: 'Public Supply',
  tank: 'Water Tank',
};

export const GENDER_LABELS: Record<GenderRestriction, string> = {
  any: 'Any',
  male_only: 'Male Only',
  female_only: 'Female Only',
  mixed: 'Mixed',
};

export const AMENITY_LABELS: Record<Amenity, string> = {
  wifi: 'WiFi',
  air_conditioning: 'Air Conditioning',
  kitchen: 'Kitchen',
  water_heater: 'Water Heater',
  tv: 'TV',
  washing_machine: 'Washing Machine',
  refrigerator: 'Refrigerator',
  workspace: 'Workspace / Desk',
  parking: 'Parking Space',
  security: '24/7 Security',
  cctv: 'CCTV',
  gated_estate: 'Gated Estate',
  balcony: 'Balcony',
  swimming_pool: 'Swimming Pool',
  gym: 'Gym',
  elevator: 'Elevator',
  prepaid_meter: 'Prepaid Meter',
  wardrobe: 'Wardrobe',
  ensuite_bathroom: 'En-suite Bathroom',
  generator: 'Generator',
};

export const DISTANCE_LABELS: Record<DistanceBucket, string> = {
  very_close: 'Very Close (5 mins or less)',
  close: 'Close (5-15 mins)',
  budget_stretch: 'Budget Stretch (15+ mins)',
};

export const LISTING_STATUSES = [
  'pending_approval',
  'active',
  'needs_roommate',
  'fully_booked',
  'archived',
  'rejected',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Statuses that occupy one of the lister's tier slots. */
export const SLOT_OCCUPYING_LISTING_STATUSES = [
  'pending_approval',
  'active',
  'needs_roommate',
  'fully_booked',
] as const satisfies readonly ListingStatus[];

export const STAY_UNITS = ['hour', 'day', 'week', 'month'] as const;
export type StayUnit = (typeof STAY_UNITS)[number];

export const LEASE_DURATION_UNITS = ['year', 'month'] as const;
export type LeaseDurationUnit = (typeof LEASE_DURATION_UNITS)[number];

export const PAYMENT_FREQUENCIES = ['annually', 'bi-annually', 'quarterly', 'monthly', 'custom'] as const;
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

export const INSTALLMENT_INTERVALS = ['monthly', 'bi-monthly'] as const;
export type InstallmentInterval = (typeof INSTALLMENT_INTERVALS)[number];

// ── Bookings ──────────────────────────────────────────────────────────────────────────────

export const BOOKING_STATUSES = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** The decisions a lister may take on a pending booking. */
export const OWNER_DECISIONS = ['confirmed', 'rejected'] as const satisfies readonly BookingStatus[];
export type OwnerDecision = (typeof OWNER_DECISIONS)[number];

/**
 * `Booking.timelineStep`. Steps only move forward; a booking is created at step 1.
 * Payment completing the booking is step 4 (status `completed`).
 */
export const BOOKING_TIMELINE_STEPS = {
  REQUESTED: 1,
  INSPECTION_SCHEDULED: 2,
  INSPECTION_VERIFIED: 3,
  PAID: 4,
} as const;
export type BookingTimelineStep = (typeof BOOKING_TIMELINE_STEPS)[keyof typeof BOOKING_TIMELINE_STEPS];

export const BOOKING_TIMELINE_LABELS: Record<BookingTimelineStep, string> = {
  1: 'Requested',
  2: 'Inspection Scheduled',
  3: 'Inspection Verified',
  4: 'Paid / Completed',
};

export const INSPECTION_STATUSES = ['pending', 'scheduled', 'completed', 'missed'] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const RENT_PERIOD_STATUSES = ['upcoming', 'due', 'overdue', 'paid'] as const;
export type RentPeriodStatus = (typeof RENT_PERIOD_STATUSES)[number];

/**
 * Why a booking cannot be paid right now. Carried on renter booking reads as
 * `paymentEligibility.reason`, and used as the error `code` when POST /bookings/:id/pay refuses.
 */
export const PAYMENT_BLOCKERS = [
  'INVALID_STATUS',
  'ALREADY_PAID',
  'CONTRACT_NOT_SIGNED',
  'LISTING_NOT_FOUND',
  'LISTING_FULLY_BOOKED',
  'INSPECTION_NOT_VERIFIED',
] as const satisfies readonly ErrorCode[];
export type PaymentBlocker = (typeof PAYMENT_BLOCKERS)[number];

/** HTTP status POST /bookings/:id/pay answers each blocker with. */
export const PAYMENT_BLOCKER_STATUS: Record<PaymentBlocker, 400 | 404 | 409> = {
  INVALID_STATUS: 400,
  ALREADY_PAID: 400,
  CONTRACT_NOT_SIGNED: 400,
  LISTING_NOT_FOUND: 404,
  LISTING_FULLY_BOOKED: 409,
  INSPECTION_NOT_VERIFIED: 409,
};

export type PaymentEligibility =
  | { payable: true }
  | { payable: false; reason: PaymentBlocker; message: string };

// ── Tiers ─────────────────────────────────────────────────────────────────────────────────

export const TIER_IDS = ['free', 'basic', 'premium', 'enterprise'] as const;
export type TierId = (typeof TIER_IDS)[number];

/** Ordering used for `Listing.renterTierValue` (higher sorts first in the feed). */
export const TIER_RANK: Record<TierId, number> = {
  free: 1,
  basic: 2,
  premium: 3,
  enterprise: 4,
};

export const TIER_LABELS: Record<TierId, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

export const BILLING_CYCLES = ['monthly', 'annually'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

// ── Admin permissions ─────────────────────────────────────────────────────────────────────
// Every admin router is guarded by `adminRbac(<resource>)`: GET/HEAD require
// `read:<resource>`, every other method `write:<resource>`. `super_admin` bypasses the check.

export const ADMIN_ROLES = ['super_admin', 'support', 'moderator'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_RESOURCES = [
  'activity',
  'ads',
  'agents',
  'analytics',
  'audit',
  'bookings',
  'companies',
  'emails',
  'listings',
  'notifications',
  'payments',
  'reports',
  'settings',
  'shared-bookings',
  'tiers',
  'users',
  'verifications',
  'waitlist',
] as const;
export type AdminResource = (typeof ADMIN_RESOURCES)[number];

export type AdminPermissionMode = 'read' | 'write';
export type AdminPermission = `${AdminPermissionMode}:${AdminResource}`;

export function adminPermission(mode: AdminPermissionMode, resource: AdminResource): AdminPermission {
  return `${mode}:${resource}` as AdminPermission;
}

/** Every permission string an `Admin.permissions` array may usefully hold. */
export const ADMIN_PERMISSIONS: readonly AdminPermission[] = ADMIN_RESOURCES.flatMap((r) => [
  adminPermission('read', r),
  adminPermission('write', r),
]);

/**
 * The admin console's action names, mapped to the backend permission that actually gates the
 * request behind each action. Check `permissions.includes(ADMIN_ACTION_PERMISSIONS[action])`
 * rather than inventing parallel strings the server will never grant.
 */
export const ADMIN_ACTION_PERMISSIONS = {
  'users.suspend': 'write:users',
  'companies.approve': 'write:companies',
  'companies.suspend': 'write:companies',
  'agents.suspend': 'write:agents',
  'verifications.review': 'write:verifications',
  'listings.moderate': 'write:listings',
  'payments.process': 'write:payments',
  'bookings.resolve': 'write:bookings',
  'reports.action': 'write:reports',
  'tiers.manage': 'write:tiers',
  'ads.manage': 'write:ads',
  'notifications.broadcast': 'write:notifications',
  'emails.send': 'write:emails',
  'settings.manage': 'write:settings',
  'waitlist.manage': 'write:waitlist',
} as const satisfies Record<string, AdminPermission>;
export type AdminAction = keyof typeof ADMIN_ACTION_PERMISSIONS;

/** Whether an admin with this role and permission list may make a request needing `permission`. */
export function adminHasPermission(
  admin: { role?: string | null; permissions?: readonly string[] | null },
  permission: AdminPermission
): boolean {
  if (admin.role === 'super_admin') return true;
  return (admin.permissions || []).includes(permission);
}

// ── Response types for the main client-consumed resources ─────────────────────────────────
// Ids and dates arrive as JSON strings. Fields are optional where the server omits them.

export type IsoDate = string;

export interface ListingEntitlements {
  tierId: TierId;
  tierName: string;
  billingCycle: BillingCycle | (string & {});
  billingCycleSource: 'purchase' | 'catalogue';
  expiresAt: IsoDate | null;
  /** The plan's own allowance, before purchased slots. */
  baseLimit: number;
  purchasedSlots: number;
  /** baseLimit + purchasedSlots: what the create gate enforces. */
  limit: number;
  used: number;
  remaining: number;
  /** used / limit as a whole-number percentage, capped at 100. */
  percentage: number;
  features: { maxListings: number; featuredListings: number; [feature: string]: unknown };
  /** Whose slots these are: the company's (shared by its agents) or the user's own. */
  scope: 'company' | 'user';
}

/** GET /api/v1/users/me */
export interface MeResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  isEmailVerified?: boolean;
  role: UserRole;
  gender?: string;
  avatar?: string;
  /** Role-aware verified flag (KYC for renters, KYC + company for listers). */
  verified: boolean;
  verificationStatus: VerificationStatus;
  hasAcceptedDisclaimer?: boolean;
  ninVerified?: boolean;
  bvnVerified?: boolean;
  university?: string;
  createdAt?: IsoDate;
  companyId?: string | { _id: string; name?: string; tradingName?: string; logo?: string; tier?: string } | null;
  company?: { id: string; name: string; verified: boolean };
  tier: {
    id: TierId;
    name: string;
    billingCycle: string;
    expiresAt: IsoDate | null;
    limits: { maxListings: number; featuredListings: number };
    entitlements: ListingEntitlements;
  };
  tierExpiresAt: IsoDate | null;
}

export interface ShortletRate {
  id: string;
  label: string;
  durationValue: number;
  durationUnit: StayUnit;
  price: number;
}

/** A listing as the public and lister read endpoints return it. */
export interface ListingResponse {
  _id: string;
  landlordId: string;
  agentId?: string;
  companyId?: string;
  title: string;
  description: string;
  rentAnnual: number;
  areaCluster: string;
  distanceBucket: DistanceBucket;
  address?: string;
  city?: string;
  landmark?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
  propertyType: PropertyType;
  furnishing: Furnishing;
  power: PowerSource;
  water: WaterSource;
  maxOccupants: number;
  currentOccupants: number;
  genderRestriction: GenderRestriction;
  status: ListingStatus;
  images: string[];
  /** Canonical AMENITIES tokens, plus any free-text the lister added. */
  amenities?: Array<Amenity | (string & {})>;
  cautionFee?: number;
  agencyFee?: number;
  shortletRates?: ShortletRate[];
  minStay?: number;
  minStayUnit?: StayUnit;
  maxStay?: number;
  maxStayUnit?: StayUnit;
  leaseDurationValue?: number;
  leaseDurationUnit?: LeaseDurationUnit;
  paymentFrequency?: PaymentFrequency;
  customPaymentPlan?: { installments: number; interval: InstallmentInterval; amountPerInstallment: number };
  renterTierValue?: number;
  createdAt?: IsoDate;
  updatedAt?: IsoDate;
}

export interface RentPeriod {
  index: number;
  label: string;
  dueDate: IsoDate;
  amount: number;
  status: RentPeriodStatus;
  paymentId?: string;
  paidAt?: IsoDate;
}

/** A booking as the renter reads it (GET /bookings, GET /bookings/:id). */
export interface BookingResponse {
  _id: string;
  listingId: string | Partial<ListingResponse>;
  userId: string;
  sharedBookingId?: string;
  isShortlet?: boolean;
  status: BookingStatus;
  moveInDate?: IsoDate;
  duration?: string;
  message?: string;
  cancellationReason?: string;
  requiresRoommate?: boolean;
  startDate?: IsoDate;
  endDate?: IsoDate;
  durationQuantity?: number;
  durationUnit?: StayUnit;
  selectedRate?: ShortletRate;
  rateQuantity?: number;
  rentPeriods?: RentPeriod[];
  leaseStartDate?: IsoDate;
  leaseEndDate?: IsoDate;
  timelineStep?: BookingTimelineStep;
  inspectionDate?: IsoDate;
  inspectionTime?: string;
  inspectionStatus?: InspectionStatus;
  isVerified?: boolean;
  inspectionVerifiedBy?: 'tenant' | 'agent';
  /** Server-computed Pay-button verdict; the same gate POST /bookings/:id/pay enforces. */
  paymentEligibility?: PaymentEligibility;
  /** List endpoint: latest payment status, or 'unpaid'. */
  paymentStatus?: string;
  /** Detail endpoint only. */
  nextRentDue?: RentPeriod | null;
  installmentsPaid?: number;
  totalInstallments?: number;
  nextDueDate?: IsoDate | null;
  createdAt?: IsoDate;
  updatedAt?: IsoDate;
}

/** POST /api/v1/bookings/summary: the fee quote, the same breakdown the checkout charges. */
export interface BookingSummaryResponse {
  listingId: string;
  propertyType: PropertyType;
  title: string;
  rentAmount: number;
  cautionFee: number;
  agencyFee: number;
  platformFee: number;
  roommateMatchingFee: number;
  total: number;
  subtotal: number;
  platformFeePercent: number;
  roommateMatchingFeePercent: number;
  splitWays: number;
  platformShare: number;
  paymentFrequency?: PaymentFrequency;
  customPaymentPlan?: { installments: number; interval: InstallmentInterval; amountPerInstallment: number };
  perPeriodCost?: number;
  isShortlet: boolean;
  isShareable: boolean;
  wantsRoommate: boolean;
  selectedRate?: ShortletRate;
  rateQuantity?: number;
  shortletRates?: ShortletRate[];
  durationLabel?: string;
}

/** A tier in the catalogue (GET /api/v1/tiers). */
export interface TierResponse {
  id: TierId | (string & {});
  name: string;
  /** @deprecated the monthly price; use priceMonthly. */
  price: number;
  priceMonthly: number;
  priceYearly: number;
  priceDisplay: string;
  billingCycle: string;
  features: {
    maxListings: number;
    analytics: string;
    support: string;
    visibility?: string;
    directContact?: boolean;
    featuredBadge?: boolean;
    verifiedBadge?: boolean;
  };
  popular?: boolean;
  active: boolean;
}

/** GET /api/v1/tiers/me */
export interface MyTierResponse {
  tierId: TierId;
  name: string;
  expiresAt: IsoDate | null;
  billingCycle: string;
  listingsUsed: number;
  listingsLimit: number;
  entitlements: ListingEntitlements;
}
