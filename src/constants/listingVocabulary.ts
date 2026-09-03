/**
 * Canonical listing vocabulary — mirrors
 * `IleSure_Backend/src/constants/listingVocabulary.ts`.
 *
 * This portal used to define its own compact values (`selfcon`, `2bedroom`,
 * `semifurnished`, `phcn`, `veryclose`) while the mobile app wrote snake_case
 * for the same concepts, so identical properties were stored under different
 * values depending on where the agent listed them. One vocabulary now, defined
 * here and shared by every form in this app.
 *
 * Keep in sync with the backend file when adding a type.
 */

export type PropertyType =
  | 'self_con'
  | '1_bed'
  | '2_bed'
  | '3_bed'
  | 'mini_flat'
  | 'studio'
  | 'penthouse'
  | 'hostel_room'
  | 'shared_apartment'
  | 'shortlet';

export type Furnishing = 'fully_furnished' | 'semi_furnished' | 'unfurnished';
export type PowerSource = 'constant' | 'gen_dependent' | 'solar_backed' | 'hybrid';
export type WaterSource = 'borehole' | 'public' | 'tank';
export type GenderRestriction = 'any' | 'male_only' | 'female_only' | 'mixed';
export type DistanceBucket = 'very_close' | 'close' | 'budget_stretch';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const propertyTypeOptions: Option<PropertyType>[] = [
  { value: 'self_con', label: 'Self-con' },
  { value: '1_bed', label: '1-Bedroom' },
  { value: '2_bed', label: '2-Bedroom' },
  { value: '3_bed', label: '3-Bedroom' },
  { value: 'mini_flat', label: 'Mini Flat' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'hostel_room', label: 'Hostel Room' },
  { value: 'shortlet', label: 'Shortlet' },
];

/** Alias kept so the create-listing forms read the same as before. */
export const propertyTypes = propertyTypeOptions;

export const furnishingOptions: Option<Furnishing>[] = [
  { value: 'fully_furnished', label: 'Fully Furnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

export const powerOptions: Option<PowerSource>[] = [
  { value: 'constant', label: 'Constant PHCN' },
  { value: 'gen_dependent', label: 'Gen Backup' },
  { value: 'solar_backed', label: 'Solar-Backed' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const waterOptions: Option<WaterSource>[] = [
  { value: 'borehole', label: 'Borehole' },
  { value: 'public', label: 'Public Supply' },
  { value: 'tank', label: 'Water Tank' },
];

export const genderOptions: Option<GenderRestriction>[] = [
  { value: 'any', label: 'Any' },
  { value: 'female_only', label: 'Female Only' },
  { value: 'male_only', label: 'Male Only' },
];

export const distanceOptions: Option<DistanceBucket>[] = [
  { value: 'very_close', label: 'Very Close' },
  { value: 'close', label: 'Close' },
  { value: 'budget_stretch', label: 'Budget Stretch' },
];


/**
 * Amenity vocabulary — mirrors `AMENITIES` / `AMENITY_LABELS` in the backend's
 * listingVocabulary. The backend canonicalises whatever a client sends, so these tokens are
 * what comes back on every listing and what the create forms should submit.
 */
export const amenityOptions = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'tv', label: 'TV' },
  { value: 'washing_machine', label: 'Washing Machine' },
  { value: 'refrigerator', label: 'Refrigerator' },
  { value: 'workspace', label: 'Workspace / Desk' },
  { value: 'parking', label: 'Parking Space' },
  { value: 'security', label: '24/7 Security' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'gated_estate', label: 'Gated Estate' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'swimming_pool', label: 'Swimming Pool' },
  { value: 'gym', label: 'Gym' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'prepaid_meter', label: 'Prepaid Meter' },
  { value: 'wardrobe', label: 'Wardrobe' },
  { value: 'ensuite_bathroom', label: 'En-suite Bathroom' },
  { value: 'generator', label: 'Generator' },
];

const LABELS: Record<string, string> = [
  ...propertyTypeOptions,
  ...furnishingOptions,
  ...powerOptions,
  ...waterOptions,
  ...genderOptions,
  ...distanceOptions,
  ...amenityOptions,
].reduce((map, o) => ({ ...map, [o.value]: o.label }), { shared_apartment: 'Shared Apartment' } as Record<string, string>);

/**
 * Display label for any stored value, falling back to a de-slugged version of
 * the raw value so a listing written before the migration still reads sensibly.
 */
export function labelFor(value?: string | null): string {
  if (!value) return '';
  return LABELS[value] || value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
