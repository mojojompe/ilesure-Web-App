/**
 * Create Listing drafts: an agent who leaves the wizard midway (closes the tab, navigates
 * away, loses connection) gets their progress back next time they open it.
 *
 * Drafts live on this device only, one per user and role. The form, step, picked
 * coordinates and uploaded tenancy agreement go in localStorage; photos are File objects,
 * which localStorage cannot hold, so they go in IndexedDB. Every read and write is
 * best-effort: a private window or full storage just means no draft, never a broken form.
 */
import type { TenancyAgreementDocument } from '../api/owner';
import { initialFormData, TOTAL_STEPS, type ListingFormData } from './listingWizard';

const DRAFT_VERSION = 1;
const KEY_PREFIX = 'ilesure:listing-draft';

export interface ListingDraft {
  version: number;
  savedAt: string;
  step: number;
  form: ListingFormData;
  coordinates: [number, number] | null;
  tenancyAgreement: TenancyAgreementDocument | null;
}

export function draftKey(role: string, userId: string | undefined): string {
  return `${KEY_PREFIX}:${role}:${userId || 'anon'}`;
}

/** True once the lister has typed or picked anything worth keeping. */
export function hasProgress(form: ListingFormData, photoCount = 0, hasAgreement = false): boolean {
  if (photoCount > 0 || hasAgreement) return true;
  return (Object.keys(initialFormData) as (keyof ListingFormData)[]).some(
    (k) => JSON.stringify(form[k]) !== JSON.stringify(initialFormData[k])
  );
}

/**
 * Parses a stored draft, or null when it is missing, corrupt or from an older shape.
 * Fields added to the form since the draft was saved fall back to their defaults.
 */
export function parseDraft(raw: string | null): ListingDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || d.version !== DRAFT_VERSION || typeof d.form !== 'object' || d.form === null) return null;
    const step = Number(d.step);
    return {
      version: DRAFT_VERSION,
      savedAt: typeof d.savedAt === 'string' ? d.savedAt : new Date().toISOString(),
      step: Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS ? step : 1,
      form: { ...initialFormData, ...d.form },
      coordinates: Array.isArray(d.coordinates) && d.coordinates.length === 2 ? d.coordinates : null,
      tenancyAgreement: d.tenancyAgreement ?? null,
    };
  } catch {
    return null;
  }
}

export function loadDraft(key: string): ListingDraft | null {
  try {
    return parseDraft(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function saveDraft(key: string, draft: Omit<ListingDraft, 'version' | 'savedAt'>): void {
  try {
    const full: ListingDraft = { ...draft, version: DRAFT_VERSION, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(full));
  } catch {
    // Storage full or blocked: the form still works, there is just no draft.
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  void saveDraftPhotos(key, []);
}

/** "just now", "5 minutes ago", "3 hours ago", or a date. */
export function describeSavedAt(savedAt: string, now: Date = new Date()): string {
  const then = new Date(savedAt);
  const mins = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (!Number.isFinite(mins) || mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------------------
// Photos (IndexedDB)
// ---------------------------------------------------------------------------------------

const DB_NAME = 'ilesure-listing-drafts';
const STORE = 'photos';

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveDraftPhotos(key: string, files: File[]): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      if (files.length) tx.objectStore(STORE).put(files, key);
      else tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // ignore
  } finally {
    db.close();
  }
}

export async function loadDraftPhotos(key: string): Promise<File[]> {
  const db = await openDb();
  if (!db) return [];
  try {
    return await new Promise<File[]>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as File[]) : []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  } finally {
    db.close();
  }
}
