/**
 * Reads a listing post as agents send it on WhatsApp ("5 unit of Room self con ... Rent 800k")
 * and pulls out what the Quick Add cards need: one unit per property type mentioned, each
 * with its rent, plus the area, landmark, distance and whatever utilities the post names.
 *
 * Rule-based on purpose: no AI on main (see the release-branch policy), and these posts are
 * formulaic enough that keyword tables catch most of them. Anything it misses the lister
 * fixes on the card. Every field it could not find is left undefined so the page can fall
 * back to the lister's remembered defaults and mark them as guesses.
 */
import type {
  PropertyType,
  Furnishing,
  PowerSource,
  WaterSource,
  GenderRestriction,
  DistanceBucket,
  Amenity,
} from '../contracts/generated';
import { PROPERTY_TYPE_LABELS } from '../contracts/generated';

export interface ParsedUnit {
  propertyType: PropertyType;
  /** How the post named it ("Room and parlour"), for the title. */
  label: string;
  /** "5 unit of ..." -> 5. */
  count?: number;
  /** Naira per year. */
  rent?: number;
}

export interface ParsedListing {
  units: ParsedUnit[];
  area?: string;
  landmark?: string;
  city?: string;
  distance?: DistanceBucket;
  furnishing?: Furnishing;
  power?: PowerSource;
  water?: WaterSource;
  gender?: GenderRestriction;
  amenities: Amenity[];
  cautionFee?: number;
  /** Yearly estate service charge. */
  serviceCharge?: number;
  /** One-off fee to view the property. */
  inspectionFee?: number;
  /** A fixed agency fee, or a percentage of each unit's rent. */
  agencyFee?: { amount: number } | { percent: number };
  /** The post itself, tidied: WhatsApp timestamps, "plus video" and phone numbers removed. */
  description: string;
  /** Things the lister should check, in plain words. */
  warnings: string[];
}

// ---------------------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------------------

/** "[15:50, 11/13/2026] NEXGEN TV: " or "11/13/26, 3:50 PM - NEXGEN TV: " at a line start. */
const WHATSAPP_PREFIX = /^\s*(?:\[[^\]]{4,30}\]\s*|\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s*[ap]m)?\s*-\s*)(?:[^:\n]{1,40}:\s*)?/i;
/** Lines that only say a video or photos come with the post. */
const MEDIA_ONLY_LINE = /^\s*(?:\+|plus|with|and)?\s*(?:a\s+)?(?:video|videos|pictures?|pics?|photos?|images?)(?:\s+(?:attached|below|loading))?\s*[.!]*\s*$/i;
const MEDIA_PLACEHOLDER = /<media omitted>|\(file attached\)|image omitted|video omitted/gi;
/** Nigerian mobile numbers: 080..., +234 80..., 234-80-.... */
const PHONE = /(?:\+?234[\s-]?|\b0)[789][01]\d(?:[\s-]?\d){7}\b/g;

export function cleanMessage(raw: string): { text: string; hadPhone: boolean } {
  let hadPhone = false;
  const lines = raw
    .replace(/\r\n?/g, '\n')
    .replace(MEDIA_PLACEHOLDER, '')
    .split('\n')
    .map((line) => line.replace(WHATSAPP_PREFIX, ''))
    .filter((line) => !MEDIA_ONLY_LINE.test(line))
    .map((line) =>
      line.replace(PHONE, () => {
        hadPhone = true;
        return '';
      })
    )
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim());
  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text, hadPhone };
}

// ---------------------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------------------

export interface MoneyToken {
  value: number;
  start: number;
  end: number;
}

/**
 * "800k", "1.2m", "₦800,000", "N800k", "#350,000", "1.5 million", "350000". Bare numbers
 * need 5+ digits (or thousands commas) so years, unit counts and dates never read as rent.
 */
const MONEY = /(₦|\bn(?=\s?\d)|#|\bngn\s?)?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(k\b|m\b|mil\b|million\b|thousand\b)?/gi;

export function findMoney(text: string): MoneyToken[] {
  const out: MoneyToken[] = [];
  for (const m of text.matchAll(MONEY)) {
    const [whole, currency, digits, suffix] = m;
    const start = m.index ?? 0;
    const before = text.slice(Math.max(0, start - 1), start);
    const after = text.slice(start + whole.length, start + whole.length + 1);
    // Part of a date (15/30, 11/13/2026), a time (15:50) or a percentage.
    if (/[/:]/.test(before) || /^[/:%]/.test(after)) continue;
    let value = Number(digits.replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    const s = (suffix || '').toLowerCase();
    if (s === 'k' || s === 'thousand') value *= 1_000;
    else if (s === 'm' || s === 'mil' || s === 'million') value *= 1_000_000;
    else if (!currency && !digits.includes(',') && digits.replace('.', '').length < 5) continue;
    value = Math.round(value);
    if (value < 1_000) continue;
    out.push({ value, start, end: start + whole.trimEnd().length });
  }
  return out;
}

// ---------------------------------------------------------------------------------------
// Property types
// ---------------------------------------------------------------------------------------

interface TypePattern {
  type: PropertyType;
  label: string;
  re: RegExp;
}

/** Most specific first: "room and parlour self con" must not also count as a self con. */
const TYPE_PATTERNS: TypePattern[] = [
  { type: 'shortlet', label: 'Shortlet', re: /\bshort[\s-]?lets?\b/gi },
  { type: '3_bed', label: '3-bedroom flat', re: /\b(?:3|three)[\s-]*bed(?:room)?s?(?:\s+(?:flat|apartment))?\b/gi },
  { type: '2_bed', label: '2-bedroom flat', re: /\b(?:2|two)[\s-]*bed(?:room)?s?(?:\s+(?:flat|apartment))?\b/gi },
  { type: 'mini_flat', label: 'Room and parlour', re: /\b(?:a\s+)?room\s*(?:and|&|n|\+)\s*(?:a\s+)?pa(?:r)?lou?r(?:\s+self[\s-]?con(?:tain(?:ed)?)?)?\b|\br\s*&\s*p\b/gi },
  { type: 'mini_flat', label: 'Mini flat', re: /\bmini[\s-]?flats?\b/gi },
  { type: '1_bed', label: '1-bedroom flat', re: /\b(?:1|one)[\s-]*bed(?:room)?s?(?:\s+(?:flat|apartment))?\b/gi },
  { type: 'studio', label: 'Studio', re: /\bstudio(?:\s+apartments?)?\b/gi },
  { type: 'penthouse', label: 'Penthouse', re: /\bpent[\s-]?house\b/gi },
  { type: 'self_con', label: 'Self-con', re: /\b(?:(?:single\s+)?room\s+)?self[\s-]?con(?:tain(?:ed)?|s)?\b|\bselfcon\b/gi },
  { type: 'hostel_room', label: 'Hostel room', re: /\bhostels?(?:\s+rooms?)?\b|\bface[\s-]?me[\s-]?i[\s-]?face[\s-]?you\b|\bsingle\s+rooms?\b/gi },
];

const WORD_NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** "5 unit of", "2 units of", "three", "1no." right before a type mention. */
function countBefore(text: string, start: number): number | undefined {
  const window = text.slice(Math.max(0, start - 24), start);
  const m = window.match(/(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:nos?\.?|units?|rooms?|flats?)?\s*(?:of\s+)?(?:the\s+)?$/i);
  if (!m) return undefined;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : WORD_NUMBERS[m[1].toLowerCase()];
  return n && n > 0 && n < 100 ? n : undefined;
}

interface TypeMention {
  type: PropertyType;
  label: string;
  start: number;
  end: number;
  count?: number;
}

function findTypeMentions(text: string): TypeMention[] {
  const taken: [number, number][] = [];
  const overlaps = (s: number, e: number) => taken.some(([a, b]) => s < b && e > a);
  const mentions: TypeMention[] = [];
  for (const { type, label, re } of TYPE_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (overlaps(start, end)) continue;
      taken.push([start, end]);
      mentions.push({ type, label, start, end, count: countBefore(text, start) });
    }
  }
  return mentions.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------------------

/** Ibadan neighbourhoods agents name, in the spelling we store. Longer names first. */
const AREAS = [
  'Old Bodija', 'New Bodija', 'Bodija', 'Agbowo', 'Ajibode', 'Orogun', 'Sango', 'Mokola', 'Ojoo',
  'Samonda', 'Apete', 'Akobo', 'Iwo Road', 'Challenge', 'Ring Road', 'Dugbe', 'Oluyole', 'Jericho',
  'Ologuneru', 'Toll Gate', 'Lagelu', 'Odo-Ona', 'Moniya', 'Akinyele', 'Eleyele', 'Apata', 'Elebu',
  'Oke-Ado', 'Idi-Ape', 'Basorun', 'Agodi', 'Ikolaba', 'Alalubosa', 'Adeoyo', 'Felele', 'Oke-Bola',
  'Ashi', 'Kongi', 'Ijokodo', 'Omi-Adio', 'Akala Express', 'Olorunda', 'Odejayi', 'Ile-Titun',
  'Kuola', 'Ajoda', 'Alakia', 'Olodo', 'Barika', 'Sasa', 'Ashipa', 'Gbekuba', 'Ogbere', 'Egbeda',
  'Olomi', 'Molete', 'Oja Oba', 'Bere', 'Oke-Itunu', 'Idi-Ishin', 'Iyana Church', 'Monatan',
  'Secretariat', 'Agbaje', 'Erunmu', 'Arulogun', 'Elewure', 'Olunloyo',
  'Kolapo Ishola', 'Akingbile', 'Onireke', 'Oke-Are',
];

/** Campuses and big landmarks; the first one named becomes the landmark. */
const LANDMARKS: { name: string; re: RegExp }[] = [
  { name: 'Lead City University', re: /\blead\s*city(?:\s+univ(?:ersity)?)?\b|\blcu\b/i },
  { name: 'University of Ibadan', re: /\b[Uu]niversity\s+of\s+[Ii]badan\b|\bU\.?I\.?(?![\w.])/ },
  { name: 'The Polytechnic, Ibadan', re: /\b(?:the\s+)?polytechnic,?\s+ibadan\b|\bibadan\s+poly\b|\bpoly\b/i },
  { name: 'Dominican University', re: /\bdominican\s+univ(?:ersity)?\b/i },
  { name: 'Ajayi Crowther University (Ibadan)', re: /\bajayi\s+crowther\b|\bacu\b/i },
  { name: 'Koladaisi University', re: /\bkola\s?daisi\b/i },
  { name: 'Precious Cornerstone University', re: /\bprecious\s+corner\s?stone\b|\bpcu\b/i },
  { name: 'UCH', re: /\bu\.?c\.?h\.?\b|\buniversity\s+college\s+hospital\b/i },
  { name: 'Bowen University (Ibadan)', re: /\bbowen\b/i },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** "Toll Gate", "toll-gate", "tollgate" all match "Toll Gate". */
const areaRe = (area: string) => new RegExp(`\\b${escapeRe(area).replace(/[\s-]+/g, '[\\s-]?')}\\b`, 'i');

function findArea(text: string): string | undefined {
  let best: { name: string; index: number } | undefined;
  for (const name of AREAS) {
    const m = text.match(areaRe(name));
    if (m && (best === undefined || (m.index ?? 0) < best.index)) best = { name, index: m.index ?? 0 };
  }
  if (best) return best.name;
  // "Location: Sabo", "located at Ososami", "in Oke Padi".
  const m = text.match(/\b(?:location|loc|address|area)\s*[:-]\s*([A-Za-z][A-Za-z' -]{2,30})|\b(?:located\s+(?:at|in)|at|in)\s+([A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){0,2})/);
  const found = (m?.[1] || m?.[2])?.trim().replace(/\s+(?:very|close|near|ibadan|oyo).*$/i, '');
  return found && !/^(?:ibadan|oyo|nigeria|the|a)$/i.test(found) ? titleCase(found) : undefined;
}

function findLandmark(text: string): string | undefined {
  let best: { name: string; index: number } | undefined;
  for (const { name, re } of LANDMARKS) {
    const m = text.match(re);
    if (m && (best === undefined || (m.index ?? 0) < best.index)) best = { name, index: m.index ?? 0 };
  }
  if (best) return best.name;
  const m = text.match(/\b(?:close\s+to|near|beside|opposite|behind|off|by)\s+([A-Za-z][A-Za-z' -]{3,40}?)(?=[,.\n]|\s+(?:ibadan|oyo|rent|price)\b|$)/i);
  return m ? titleCase(m[1].trim()) : undefined;
}

function titleCase(s: string): string {
  return s.replace(/\b([a-z])([a-z']*)/gi, (_, a: string, b: string) => a.toUpperCase() + b.toLowerCase());
}

// ---------------------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------------------

function firstMatch<T>(text: string, table: [RegExp, T][]): T | undefined {
  for (const [re, value] of table) if (re.test(text)) return value;
  return undefined;
}

const DISTANCE_TABLE: [RegExp, DistanceBucket][] = [
  [/\bvery\s+(?:close|near)\b|\bwalking\s+distance\b|\bstone'?s?\s+throw\b|\bbeside\b|\bopposite\b|\badjacent\b|\bdirectly\s+(?:behind|in\s+front)\b|\binside\s+(?:the\s+)?(?:school|campus)\b/i, 'very_close'],
  [/\b(?:a\s+)?(?:short|few\s+min(?:ute)?s?)\s+drive\b|\b(?:one|1|two|2)\s+(?:bus|drop|taxi|keke)\b|\btransport\s+(?:to|fare)\b|\bnot\s+too\s+far\b/i, 'budget_stretch'],
  [/\bclose\s+to\b|\bnear(?:by)?\b|\bclose\s+by\b|\bnot\s+far\b|\bbehind\b|\bfew\s+min(?:ute)?s?\s+walk\b/i, 'close'],
];

const FURNISHING_TABLE: [RegExp, Furnishing][] = [
  [/\bsemi[\s-]?furnished\b/i, 'semi_furnished'],
  [/\bun[\s-]?furnished\b|\bnot\s+furnished\b|\bempty\s+room\b/i, 'unfurnished'],
  [/\b(?:fully\s+)?furnished\b/i, 'fully_furnished'],
];

const POWER_TABLE: [RegExp, PowerSource][] = [
  [/\bhybrid\b|\bsolar\b.*\b(?:gen|generator|phcn|nepa)\b|\b(?:gen|generator|phcn|nepa)\b.*\bsolar\b/i, 'hybrid'],
  [/\bsolar\b|\binverter\b/i, 'solar_backed'],
  [/\b(?:gen|generator)\b/i, 'gen_dependent'],
  [/\b(?:24\/7|24hrs?|constant|steady|stable|uninterrupted)\s+(?:light|power|electricity|supply|nepa|phcn)\b|\bband\s+a\b/i, 'constant'],
];

const WATER_TABLE: [RegExp, WaterSource][] = [
  [/\bbore[\s-]?holes?\b/i, 'borehole'],
  [/\b(?:water\s+)?tanks?\b|\boverhead\s+tank\b/i, 'tank'],
  [/\b(?:public|tap|wsc|water\s+corporation)\s+water\b|\bpublic\s+supply\b/i, 'public'],
];

const GENDER_TABLE: [RegExp, GenderRestriction][] = [
  [/\b(?:female|girls?|ladies|women)\s+(?:only|students)\b|\bfor\s+(?:females?|girls?|ladies)\b/i, 'female_only'],
  [/\b(?:male|boys?|men)\s+(?:only|students)\b|\bfor\s+(?:males?|boys?)\b/i, 'male_only'],
];

const AMENITY_TABLE: [RegExp, Amenity][] = [
  [/\bprepaid(?:\s+meter)?\b/i, 'prepaid_meter'],
  [/\bwardrobes?\b/i, 'wardrobe'],
  [/\bkitchen(?:\s+cabinets?)?\b|\bcabinets?\b/i, 'kitchen'],
  [/\bwi[\s-]?fi\b|\binternet\b/i, 'wifi'],
  [/\bair[\s-]?condition(?:er|ing|ed)?\b|\ba\.?c\b/i, 'air_conditioning'],
  [/\b(?:car\s+)?park(?:ing)?\s*(?:space|lot)?\b|\bcar\s+park\b/i, 'parking'],
  [/\bsecurity\b|\bgate\s?man\b|\bsecurity\s+guard\b|\bfenced\b/i, 'security'],
  [/\bcctv\b/i, 'cctv'],
  [/\bgated\b|\bestate\b/i, 'gated_estate'],
  [/\bbalcon(?:y|ies)\b/i, 'balcony'],
  [/\bwater\s+heater\b|\bheater\b/i, 'water_heater'],
  [/\ben[\s-]?suite\b|\bprivate\s+(?:toilet|bathroom)\b|\bown\s+(?:toilet|bathroom)\b/i, 'ensuite_bathroom'],
  [/\b(?:gen|generator)\b/i, 'generator'],
];

// ---------------------------------------------------------------------------------------
// The parser
// ---------------------------------------------------------------------------------------

const FEE_WORDS = /\b(caution|refundable|damage|agency|agent|agt|commission|legal|agreement|service\s+charge|inspection|insp)\b[^\n\d₦#]{0,15}$/i;

function lineOf(text: string, index: number): number {
  let n = 0;
  for (let i = 0; i < index; i++) if (text[i] === '\n') n++;
  return n;
}

export function parseListingMessage(raw: string): ParsedListing {
  const { text, hadPhone } = cleanMessage(raw);
  const warnings: string[] = [];
  if (hadPhone) warnings.push('Removed a phone number from the description. Renters contact you through iléSure.');

  const mentions = findTypeMentions(text);
  const units: (ParsedUnit & { mentions: TypeMention[] })[] = [];
  for (const m of mentions) {
    const existing = units.find((u) => u.propertyType === m.type);
    if (existing) {
      existing.mentions.push(m);
      if (existing.count === undefined && m.count !== undefined) existing.count = m.count;
      continue;
    }
    units.push({ propertyType: m.type, label: m.label, count: m.count, mentions: [m] });
  }

  // Fees: a price right after "caution", "agency" etc.
  let cautionFee: number | undefined;
  let serviceCharge: number | undefined;
  let inspectionFee: number | undefined;
  let agencyFee: ParsedListing['agencyFee'];
  const rents: MoneyToken[] = [];
  for (const token of findMoney(text)) {
    const before = text.slice(Math.max(0, token.start - 30), token.start);
    const fee = before.match(FEE_WORDS)?.[1]?.toLowerCase();
    if (!fee) {
      rents.push(token);
      continue;
    }
    if (/caution|refundable|damage/.test(fee)) cautionFee ??= token.value;
    else if (/agen|agt|commission/.test(fee)) agencyFee ??= { amount: token.value };
    else if (/service/.test(fee)) serviceCharge ??= token.value;
    else if (/insp/.test(fee)) inspectionFee ??= token.value;
    // Legal and agreement fees stay in the description only.
  }
  const percent = text.match(/\b(?:agency|agent|agt|commission)\b[^\n\d]{0,15}(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (!agencyFee && percent) agencyFee = { percent: Number(percent[1]) };

  // Monthly or per-night prices are not annual rent.
  const monthly = /\b(?:per\s+month|monthly|\/\s?(?:month|mth|mo)\b|a\s+month)\b/i.test(text);
  const shortlet = units.some((u) => u.propertyType === 'shortlet');

  // Pass 1: a price on the same line as, and after, a type mention belongs to that type.
  const unassigned: MoneyToken[] = [];
  for (const token of rents) {
    const line = lineOf(text, token.start);
    let owner: (typeof units)[number] | undefined;
    let ownerStart = -1;
    for (const unit of units) {
      for (const m of unit.mentions) {
        if (m.end <= token.start && lineOf(text, m.start) === line && m.start > ownerStart) {
          owner = unit;
          ownerStart = m.start;
        }
      }
    }
    if (owner && owner.rent === undefined) owner.rent = token.value;
    else unassigned.push(token);
  }
  // Pass 2: "Rent 800k" on its own line goes to the first type still without a price.
  for (const token of unassigned) {
    const target = units.find((u) => u.rent === undefined);
    if (target) target.rent = token.value;
  }

  if (units.length === 0) {
    units.push({ propertyType: 'self_con', label: PROPERTY_TYPE_LABELS.self_con, rent: rents[0]?.value, mentions: [] });
    warnings.push("Couldn't tell the property type, so it's set to Self-con. Please check.");
  }
  if (monthly && !shortlet) {
    for (const unit of units) if (unit.rent !== undefined) unit.rent *= 12;
    warnings.push('The post quotes a monthly price, so the rent was multiplied by 12 for the yearly figure. Please check.');
  }
  for (const unit of units) {
    if (unit.rent === undefined) warnings.push(`No price found for the ${unit.label.toLowerCase()}.`);
    else if (unit.rent < 10_000 && unit.propertyType !== 'shortlet') warnings.push(`The ${unit.label.toLowerCase()} price looks too low (₦${unit.rent.toLocaleString()}).`);
  }

  const area = findArea(text);
  if (!area) warnings.push("Couldn't find the area. Please type it in.");

  return {
    units: units.map((u) => ({ propertyType: u.propertyType, label: u.label, count: u.count, rent: u.rent })),
    area,
    landmark: findLandmark(text),
    city: /\bibadan\b/i.test(text) ? 'Ibadan' : /\blagos\b/i.test(text) ? 'Lagos' : undefined,
    distance: firstMatch(text, DISTANCE_TABLE),
    furnishing: firstMatch(text, FURNISHING_TABLE),
    power: firstMatch(text, POWER_TABLE),
    water: firstMatch(text, WATER_TABLE),
    gender: firstMatch(text, GENDER_TABLE),
    amenities: [...new Set(AMENITY_TABLE.filter(([re]) => re.test(text)).map(([, a]) => a))],
    cautionFee,
    serviceCharge,
    inspectionFee,
    agencyFee,
    description: text,
    warnings,
  };
}

/** "Self-con at Toll Gate, near Lead City University", within the 5-100 character limit. */
export function suggestTitle(unit: Pick<ParsedUnit, 'label' | 'count'>, area?: string, landmark?: string): string {
  let title = unit.label.charAt(0).toUpperCase() + unit.label.slice(1);
  if (area) title += ` at ${area}`;
  if (landmark && !(area && landmark.toLowerCase().includes(area.toLowerCase()))) {
    const withLandmark = `${title}, near ${landmark}`;
    if (withLandmark.length <= 100) title = withLandmark;
  }
  return title.length >= 5 ? title.slice(0, 100) : `${title} for rent`;
}
