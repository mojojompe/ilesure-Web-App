/**
 * Listing form options for this portal. The canonical values, their types and their display
 * labels come from the API contract (contracts/generated.ts), shared byte-for-byte with the
 * backend and every other client; this file only decides which values each picker offers and
 * in what order.
 *
 * History: this portal once defined its own compact values (`selfcon`, `2bedroom`, `phcn`)
 * while the mobile app wrote snake_case, so identical properties were stored differently
 * depending on where they were listed. Never store a label; store the value.
 */
import {
  AMENITIES,
  AMENITY_LABELS,
  DISTANCE_BUCKETS,
  DISTANCE_LABELS,
  FURNISHINGS,
  FURNISHING_LABELS,
  GENDER_LABELS,
  POWER_LABELS,
  POWER_SOURCES,
  PROPERTY_TYPE_LABELS,
  WATER_LABELS,
  WATER_SOURCES,
} from '../contracts/generated';
import type {
  Amenity,
  DistanceBucket,
  Furnishing,
  GenderRestriction,
  PowerSource,
  PropertyType,
  WaterSource,
} from '../contracts/generated';

export type {
  DistanceBucket,
  Furnishing,
  GenderRestriction,
  PowerSource,
  PropertyType,
  WaterSource,
} from '../contracts/generated';

export interface Option<T extends string> {
  value: T;
  label: string;
}

const option = <T extends string>(labels: Record<T, string>) => (value: T): Option<T> => ({
  value,
  label: labels[value],
});

/** `shared_apartment` is created by the roommate flow, not picked on the listing form. */
export const propertyTypeOptions: Option<PropertyType>[] = (
  ['self_con', '1_bed', '2_bed', '3_bed', 'mini_flat', 'studio', 'penthouse', 'hostel_room', 'shortlet'] as const
).map(option(PROPERTY_TYPE_LABELS));

/** Alias kept so the create-listing forms read the same as before. */
export const propertyTypes = propertyTypeOptions;

export const furnishingOptions: Option<Furnishing>[] = FURNISHINGS.map(option(FURNISHING_LABELS));

export const powerOptions: Option<PowerSource>[] = POWER_SOURCES.map(option(POWER_LABELS));

export const waterOptions: Option<WaterSource>[] = WATER_SOURCES.map(option(WATER_LABELS));

/** `mixed` is a legacy stored value; the form offers the three current choices. */
export const genderOptions: Option<GenderRestriction>[] = (['any', 'female_only', 'male_only'] as const).map(
  option(GENDER_LABELS)
);

export const distanceOptions: Option<DistanceBucket>[] = DISTANCE_BUCKETS.map(option(DISTANCE_LABELS));

/**
 * Amenity picker options: the contract's canonical tokens. The backend canonicalises whatever
 * a client sends, so these tokens are what comes back on every listing.
 */
export const amenityOptions: Option<Amenity>[] = AMENITIES.map(option(AMENITY_LABELS));

const LABELS: Record<string, string> = {
  ...PROPERTY_TYPE_LABELS,
  ...FURNISHING_LABELS,
  ...POWER_LABELS,
  ...WATER_LABELS,
  ...GENDER_LABELS,
  ...DISTANCE_LABELS,
  ...AMENITY_LABELS,
};

/**
 * Display label for any stored value, falling back to a de-slugged version of
 * the raw value so a listing written before the migration still reads sensibly.
 */
export function labelFor(value?: string | null): string {
  if (!value) return '';
  return LABELS[value] || value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
