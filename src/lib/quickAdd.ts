/**
 * Quick Add: the UI-free half of the "paste a WhatsApp post, drop the video, publish" flow.
 *
 * A pasted post becomes one draft card per property type it mentions (a post offering self
 * cons and a room and parlour becomes two listings sharing the same photos). Each card holds
 * an ordinary ListingFormData, so publishing reuses the Create Listing payload builder and
 * validation unchanged. Fields the post did not mention are filled from the lister's
 * remembered choices and listed in `guessed`, so the page can ask for a glance at them.
 */
import type { DistanceBucket, Furnishing, GenderRestriction, PowerSource, WaterSource } from '../contracts/generated';
import { initialFormData, validateForSubmit, validateMedia, type ListingFormData } from './listingWizard';
import { suggestTitle, type ParsedListing } from './whatsappListingParser';

export interface QuickDefaults {
  city: string;
  distanceFromSchool: DistanceBucket;
  furnishing: Furnishing;
  power: PowerSource;
  water: WaterSource;
  gender: GenderRestriction;
}

export type RememberedField = keyof QuickDefaults;
export const REMEMBERED_FIELDS: RememberedField[] = ['city', 'distanceFromSchool', 'furnishing', 'power', 'water', 'gender'];

export const FALLBACK_DEFAULTS: QuickDefaults = {
  city: 'Ibadan',
  distanceFromSchool: initialFormData.distanceFromSchool,
  furnishing: initialFormData.furnishing,
  power: initialFormData.power,
  water: initialFormData.water,
  gender: initialFormData.gender,
};

export type CardStatus = 'draft' | 'publishing' | 'published' | 'failed';

export interface QuickCard {
  id: string;
  form: ListingFormData;
  /** Fields filled from remembered choices rather than the post. */
  guessed: RememberedField[];
  warnings: string[];
  photos: File[];
  video: File | null;
  status: CardStatus;
  error?: string;
  /** Set once the listing exists, so a retry only re-sends the photos. */
  listingId?: string;
}

let seq = 0;
const newId = () => `q${Date.now().toString(36)}${(++seq).toString(36)}`;

export function cardsFromMessage(
  parsed: ParsedListing,
  defaults: QuickDefaults,
  media: { photos: File[]; video: File | null }
): QuickCard[] {
  const city = parsed.city ?? defaults.city;
  const area = parsed.area ?? '';
  const pick = <K extends RememberedField>(field: K, found: QuickDefaults[K] | undefined, guessed: RememberedField[]) => {
    if (found !== undefined) return found;
    guessed.push(field);
    return defaults[field];
  };

  return parsed.units.map((unit) => {
    const guessed: RememberedField[] = [];
    if (!parsed.city) guessed.push('city');
    const isShortlet = unit.propertyType === 'shortlet';
    const rent = unit.rent;
    const agencyFee = isShortlet || !parsed.agencyFee
      ? ''
      : 'amount' in parsed.agencyFee
        ? String(parsed.agencyFee.amount)
        : rent ? String(Math.round((rent * parsed.agencyFee.percent) / 100)) : '';
    const countLine = unit.count && unit.count > 1 ? `${unit.count} units of this ${unit.label.toLowerCase()} available.\n\n` : '';
    const form: ListingFormData = {
      ...initialFormData,
      title: suggestTitle(unit, parsed.area, parsed.landmark),
      description: countLine + parsed.description,
      propertyType: unit.propertyType,
      annualRent: !isShortlet && rent ? String(rent) : '',
      shortletRates: isShortlet && rent ? [{ label: 'Per night', durationValue: '1', durationUnit: 'day', price: String(rent) }] : [],
      cautionFee: !isShortlet && parsed.cautionFee ? String(parsed.cautionFee) : '',
      serviceCharge: !isShortlet && parsed.serviceCharge ? String(parsed.serviceCharge) : '',
      inspectionFee: !isShortlet && parsed.inspectionFee ? String(parsed.inspectionFee) : '',
      agencyFee,
      area,
      landmark: parsed.landmark ?? '',
      city,
      address: [area, city].filter(Boolean).join(', '),
      amenities: [...parsed.amenities],
      distanceFromSchool: pick('distanceFromSchool', parsed.distance, guessed),
      furnishing: pick('furnishing', parsed.furnishing, guessed),
      power: pick('power', parsed.power, guessed),
      water: pick('water', parsed.water, guessed),
      gender: pick('gender', parsed.gender, guessed),
    };
    const unitWarnings = parsed.warnings.filter((w) => !/^No price found|price looks too low/.test(w) || w.includes(unit.label.toLowerCase()));
    return {
      id: newId(),
      form,
      guessed,
      warnings: unitWarnings,
      photos: [...media.photos],
      video: media.video,
      status: 'draft',
    };
  });
}

/** The files to upload, photos first (the first photo is the cover). */
export function cardMedia(card: Pick<QuickCard, 'photos' | 'video'>): File[] {
  return card.video ? [...card.photos, card.video] : card.photos;
}

/** What still stops this card publishing, or null. */
export function cardProblem(card: Pick<QuickCard, 'form' | 'photos' | 'video'>): string | null {
  return validateForSubmit(card.form) ?? validateMedia(cardMedia(card));
}

// ---------------------------------------------------------------------------------------
// Storage: remembered choices and unpublished cards survive a reload. Best-effort only.
// ---------------------------------------------------------------------------------------

const PREFIX = 'ilesure:quick-add';

export const defaultsKey = (role: string, userId?: string) => `${PREFIX}:defaults:${role}:${userId || 'anon'}`;
export const cardsKey = (role: string, userId?: string) => `${PREFIX}:cards:${role}:${userId || 'anon'}`;
export const cardPhotosKey = (role: string, userId: string | undefined, cardId: string) => `${cardsKey(role, userId)}:${cardId}`;

export function loadDefaults(key: string): QuickDefaults {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null') as Partial<QuickDefaults> | null;
    return { ...FALLBACK_DEFAULTS, ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return { ...FALLBACK_DEFAULTS };
  }
}

export function saveDefaults(key: string, defaults: QuickDefaults): void {
  try {
    localStorage.setItem(key, JSON.stringify(defaults));
  } catch {
    // ignore
  }
}

/** A card as stored: its files live in IndexedDB under cardPhotosKey. */
export type StoredCard = Omit<QuickCard, 'photos' | 'video'> & { hasVideo: boolean };

export function loadStoredCards(key: string): StoredCard[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]') as StoredCard[];
    return Array.isArray(raw)
      ? raw
          .filter((c) => c && typeof c.id === 'string' && c.form && c.status !== 'published')
          .map((c) => ({ ...c, form: { ...initialFormData, ...c.form }, status: c.status === 'publishing' ? 'draft' : c.status }))
      : [];
  } catch {
    return [];
  }
}

export function saveStoredCards(key: string, cards: QuickCard[]): void {
  try {
    const stored: StoredCard[] = cards
      .filter((c) => c.status !== 'published')
      .map(({ photos: _photos, video, ...rest }) => ({ ...rest, hasVideo: Boolean(video) }));
    if (stored.length) localStorage.setItem(key, JSON.stringify(stored));
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Splits stored files back into photos and the (single) video. */
export function splitMedia(files: File[]): { photos: File[]; video: File | null } {
  const video = files.find((f) => f.type.startsWith('video/')) ?? null;
  return { photos: files.filter((f) => f !== video), video };
}
