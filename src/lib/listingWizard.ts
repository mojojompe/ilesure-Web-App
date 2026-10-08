/**
 * Listing wizard: the UI-free half of the Create Listing flow, shared by agents and
 * companies. Form shape, step order, per-step validation, photo checks, verification
 * check and the create-payload builder all live here as pure functions; the
 * `useListingWizard` hook holds state and talks to the owner API.
 */
import type {
  PropertyType,
  Furnishing,
  PowerSource,
  WaterSource,
  GenderRestriction,
  DistanceBucket,
  InstallmentInterval,
  PaymentFrequency,
  StayUnit,
} from '../contracts/generated';
import type { TenancyAgreementDocument } from '../api/owner';

export type { PaymentFrequency, StayUnit } from '../contracts/generated';

export const paymentFrequencyOptions: { value: PaymentFrequency; label: string }[] = [
  { value: 'annually', label: 'Yearly' },
  { value: 'bi-annually', label: 'Bi-annually' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

export interface ShortletRateForm {
  id?: string;
  label: string;
  durationValue: string;
  durationUnit: StayUnit;
  price: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  additionalNotes: string;
  address: string;
  city: string;
  landmark: string;
  area: string;
  distanceFromSchool: DistanceBucket;
  annualRent: string;
  cautionFee: string;
  agencyFee: string;
  paymentFrequency: PaymentFrequency;
  customInstallments: string;
  customInterval: InstallmentInterval;
  customAmountPerInstallment: string;
  propertyType: PropertyType;
  shortletRates: ShortletRateForm[];
  minStay: string;
  minStayUnit: StayUnit;
  maxStay: string;
  maxStayUnit: StayUnit;
  maxOccupants: string;
  gender: GenderRestriction;
  furnishing: Furnishing;
  power: PowerSource;
  water: WaterSource;
  amenities: string[];
  petsAllowed: boolean;
  smokingAllowed: boolean;
  studentsOnly: boolean;
  leaseDurationValue: string;
  leaseDurationUnit: 'year' | 'month';
  availableDays: string[];
  availableTimeSlots: string[];
  inspectionNotes: string;
}

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const PRESET_TIME_SLOTS = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'];
const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SLOTS = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
const DEFAULT_INSPECTION_NOTES = 'Inspections available Mon-Sat 9am to 4pm';

export const initialFormData: ListingFormData = {
  title: '',
  description: '',
  additionalNotes: '',
  address: '',
  city: '',
  landmark: '',
  area: '',
  distanceFromSchool: 'close',
  annualRent: '',
  cautionFee: '',
  agencyFee: '',
  paymentFrequency: 'annually',
  customInstallments: '',
  customInterval: 'monthly',
  customAmountPerInstallment: '',
  propertyType: 'self_con',
  shortletRates: [],
  minStay: '',
  minStayUnit: 'day',
  maxStay: '',
  maxStayUnit: 'month',
  maxOccupants: '1',
  gender: 'any',
  furnishing: 'unfurnished',
  power: 'constant',
  water: 'public',
  amenities: [],
  petsAllowed: false,
  smokingAllowed: false,
  studentsOnly: false,
  leaseDurationValue: '1',
  leaseDurationUnit: 'year',
  availableDays: [...DEFAULT_DAYS],
  availableTimeSlots: [...DEFAULT_SLOTS],
  inspectionNotes: '',
};

export type StepKey =
  | 'basics'
  | 'location'
  | 'property'
  | 'pricing'
  | 'furnishing'
  | 'utilities'
  | 'rules'
  | 'photos'
  | 'review';

/** Display order. Index + 1 is the step number shown to the user. */
export const STEPS: { key: StepKey; title: string }[] = [
  { key: 'basics', title: 'Basic Info' },
  { key: 'location', title: 'Location' },
  { key: 'property', title: 'Property Type' },
  { key: 'pricing', title: 'Pricing' },
  { key: 'furnishing', title: 'Furnishing' },
  { key: 'utilities', title: 'Utilities' },
  { key: 'rules', title: 'Rules' },
  { key: 'photos', title: 'Photos' },
  { key: 'review', title: 'Review & Submit' },
];

export const TOTAL_STEPS = STEPS.length;

export function stepAt(step: number): { key: StepKey; title: string } | undefined {
  return STEPS[step - 1];
}

const num = (v: string) => (v === '' ? NaN : Number(v));

/**
 * The problem with the given step, or null when it may be left. Validation is keyed by
 * what the step shows (QA-AGT-015 / QA-CO-021), not by its position: the copies checked
 * rent on the Property Type step, so a lister could never advance past it.
 */
export function validateStep(key: StepKey, form: ListingFormData): string | null {
  switch (key) {
    case 'basics':
      if (!form.title.trim()) return 'Please give the listing a title.';
      if (!form.description.trim()) return 'Please add a description.';
      return null;
    case 'location':
      if (!form.address.trim()) return 'Please enter the address.';
      if (!form.city.trim()) return 'Please enter the city.';
      if (!form.area.trim()) return 'Please enter the area or cluster.';
      return null;
    case 'property': {
      const occupants = num(form.maxOccupants);
      if (!Number.isFinite(occupants) || occupants < 1) return 'Maximum occupants must be at least 1.';
      return null;
    }
    case 'pricing': {
      if (form.propertyType === 'shortlet') {
        if (!form.shortletRates.length) return 'Add at least one shortlet rate.';
        return null;
      }
      const rent = num(form.annualRent);
      if (!Number.isFinite(rent)) return 'Please enter the annual rent.';
      if (rent < 10000) return 'Annual rent must be at least ₦10,000.';
      for (const [label, value] of [['Caution fee', form.cautionFee], ['Agency fee', form.agencyFee]] as const) {
        if (value !== '' && (!Number.isFinite(num(value)) || num(value) < 0)) {
          return `${label} cannot be negative.`;
        }
      }
      return null;
    }
    default:
      return null;
  }
}

/** Shortlet tiers complete enough to publish. */
export function validShortletRates(form: ListingFormData): ShortletRateForm[] {
  return form.shortletRates.filter((r) => r.label.trim() && Number(r.price) > 0 && Number(r.durationValue) >= 1);
}

/** Checks that apply to the whole form at publish time. */
export function validateForSubmit(form: ListingFormData): string | null {
  for (const { key } of STEPS) {
    const problem = validateStep(key, form);
    if (problem) return problem;
  }
  if (form.propertyType === 'shortlet' && validShortletRates(form).length === 0) {
    return 'Add at least one shortlet pricing tier (label, duration, and price).';
  }
  return null;
}

export function leaseLabel(form: Pick<ListingFormData, 'leaseDurationValue' | 'leaseDurationUnit'>): string {
  const value = Number(form.leaseDurationValue) || 1;
  return `${value} ${form.leaseDurationUnit}${value > 1 ? 's' : ''}`;
}

export interface PayloadExtras {
  /** GeoJSON order [lng, lat], from a picked address suggestion. */
  coordinates?: [number, number] | null;
  tenancyAgreement?: TenancyAgreementDocument | null;
}

/** The body for POST /{role}/listings. */
export function buildListingPayload(form: ListingFormData, extras: PayloadExtras = {}): Record<string, unknown> {
  const isShortlet = form.propertyType === 'shortlet';
  return {
    title: form.title,
    description: form.description,
    propertyType: form.propertyType,
    rentAnnual: isShortlet ? 0 : Number(form.annualRent),
    cautionFee: form.cautionFee ? Number(form.cautionFee) : undefined,
    agencyFee: form.agencyFee ? Number(form.agencyFee) : undefined,
    paymentFrequency: form.paymentFrequency,
    customPaymentPlan: form.paymentFrequency === 'custom'
      ? {
          installments: Number(form.customInstallments),
          interval: form.customInterval,
          amountPerInstallment: Number(form.customAmountPerInstallment),
        }
      : undefined,
    // Lease term (regular rentals only)
    leaseDurationValue: isShortlet ? undefined : Number(form.leaseDurationValue) || 1,
    leaseDurationUnit: isShortlet ? undefined : form.leaseDurationUnit,
    leaseDuration: isShortlet ? undefined : leaseLabel(form),
    additionalNotes: form.additionalNotes || undefined,
    shortletRates: isShortlet
      ? validShortletRates(form).map((r) => ({
          label: r.label.trim(),
          durationValue: Number(r.durationValue),
          durationUnit: r.durationUnit,
          price: Number(r.price),
        }))
      : undefined,
    minStay: form.minStay ? Number(form.minStay) : undefined,
    minStayUnit: form.minStay ? form.minStayUnit : undefined,
    maxStay: form.maxStay ? Number(form.maxStay) : undefined,
    maxStayUnit: form.maxStay ? form.maxStayUnit : undefined,
    // Only sent when the lister picked a suggestion; otherwise the server geocodes
    // address/city/areaCluster itself.
    ...(extras.coordinates ? { location: { type: 'Point', coordinates: extras.coordinates } } : {}),
    address: form.address,
    city: form.city,
    landmark: form.landmark,
    areaCluster: form.area,
    distanceBucket: form.distanceFromSchool,
    maxOccupants: Number(form.maxOccupants),
    genderRestriction: form.gender,
    furnishing: form.furnishing,
    power: form.power,
    water: form.water,
    amenities: form.amenities,
    rules: [
      ...(form.petsAllowed ? ['pets_allowed'] : []),
      ...(form.smokingAllowed ? ['smoking_allowed'] : []),
      ...(form.studentsOnly ? ['students_only'] : []),
    ],
    inspectionAvailability: {
      availableDays: form.availableDays.length > 0 ? form.availableDays : [...DEFAULT_DAYS],
      timeSlots: form.availableTimeSlots.length > 0 ? form.availableTimeSlots : [...DEFAULT_SLOTS],
      notes: form.inspectionNotes || DEFAULT_INSPECTION_NOTES,
    },
    images: [],
    // QA-AGT-010 / QA-CO-014: omit the key when there is no custom agreement; the server
    // uses the standard template.
    ...(extras.tenancyAgreement ? { tenancyAgreement: extras.tenancyAgreement } : {}),
  };
}

/** Normalises a typed time slot ("10:00 am" -> "10:00 AM"); null when blank. */
export function formatTimeSlot(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
}

// Same cap/whitelist shape as TenancyAgreementUpload's MAX_FILE_SIZE_BYTES check.
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Splits picked files into the ones to keep (respecting the photo cap) and the reason for
 * the first rejected file, if any.
 */
export function selectPhotos(
  current: File[],
  picked: Pick<File, 'name' | 'type' | 'size'>[]
): { accepted: File[]; problem: string | null } {
  const valid: File[] = [];
  const rejected: string[] = [];
  for (const file of picked) {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      rejected.push(`${file.name} is not a JPEG, PNG, or WEBP image.`);
      continue;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      rejected.push(`${file.name} is larger than 5MB.`);
      continue;
    }
    valid.push(file as File);
  }
  const room = Math.max(0, MAX_PHOTOS - current.length);
  return { accepted: [...current, ...valid.slice(0, room)], problem: rejected[0] ?? null };
}

/** Joins a server rejection's message and field details for display. */
export function describeSubmitError(error: { message?: string; details?: string[] } | undefined): string {
  return [error?.message || 'Failed to create listing', ...(error?.details || [])].filter(Boolean).join(' · ');
}

export interface KycSnapshot {
  verificationStatus?: string;
  ninVerified?: boolean;
  bvnVerified?: boolean;
  role?: string;
}

const BVN_ROLES = ['agent', 'company', 'landlord', 'sub_agent'];

/**
 * Mirrors the backend's create-listing gate (identityVerification.isVerifiedForRole):
 * verified outright, or the identity checks the role needs are complete.
 */
export function isVerifiedToList(kyc: KycSnapshot, fallbackRole: string): boolean {
  if (kyc.verificationStatus === 'verified') return true;
  const role = kyc.role || fallbackRole;
  return BVN_ROLES.includes(role) ? Boolean(kyc.ninVerified && kyc.bvnVerified) : Boolean(kyc.ninVerified);
}
