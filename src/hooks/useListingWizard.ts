import { useCallback, useEffect, useRef, useState } from 'react';
import { ownerApi, type OwnerRole, type TenancyAgreementDocument } from '../api/owner';
import {
  initialFormData,
  stepAt,
  TOTAL_STEPS,
  validateStep,
  validateForSubmit,
  buildListingPayload,
  selectPhotos,
  validateMedia,
  formatTimeSlot,
  describeSubmitError,
  type ListingFormData,
  type ShortletRateForm,
} from '../lib/listingWizard';
import { browserCanCompress, canSendAsIs, compressVideo } from '../lib/videoCompress';
import { draftKey, loadDraft, saveDraft, clearDraft, hasProgress, saveDraftPhotos, loadDraftPhotos } from '../lib/listingDraft';

type BooleanField = { [K in keyof ListingFormData]: ListingFormData[K] extends boolean ? K : never }[keyof ListingFormData];

/**
 * State and actions for the Create Listing wizard. The page renders; this owns the form,
 * step navigation, photo/agreement selection and publishing through the owner API.
 * `onPublished` runs after the listing (and its photos) are saved.
 *
 * Progress is saved as a draft on every change (see lib/listingDraft), so a lister who
 * leaves midway picks up where they stopped. Publishing clears the draft.
 */
export function useListingWizard(role: OwnerRole, onPublished: () => void, userId?: string) {
  const api = ownerApi(role);
  const key = draftKey(role, userId);
  const [initialDraft] = useState(() => loadDraft(key));
  const [restoredDraft, setRestoredDraft] = useState(initialDraft ? { savedAt: initialDraft.savedAt } : null);
  const [step, setStep] = useState(initialDraft?.step ?? 1);
  const [form, setForm] = useState<ListingFormData>(initialDraft?.form ?? initialFormData);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(initialDraft?.coordinates ?? null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [tenancyAgreement, setTenancyAgreement] = useState<TenancyAgreementDocument | null>(initialDraft?.tenancyAgreement ?? null);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const published = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  /** A video being shrunk to fit the upload limit before it joins the photos. */
  const [shrinking, setShrinking] = useState<{ name: string; progress: number } | null>(null);

  // Photos are stored separately (IndexedDB) and come back asynchronously.
  useEffect(() => {
    let cancelled = false;
    loadDraftPhotos(key).then((files) => {
      if (cancelled) return;
      if (files.length) setPhotoFiles((prev) => (prev.length ? prev : files));
      setPhotosLoaded(true);
    });
    return () => { cancelled = true; };
  }, [key]);

  useEffect(() => {
    if (published.current) return;
    if (hasProgress(form, photoFiles.length, Boolean(tenancyAgreement))) {
      saveDraft(key, { step, form, coordinates, tenancyAgreement });
    } else {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
  }, [key, step, form, coordinates, tenancyAgreement, photoFiles.length]);

  useEffect(() => {
    // Wait for the stored photos first, or the empty initial list would wipe them.
    if (!photosLoaded || published.current) return;
    void saveDraftPhotos(key, photoFiles);
  }, [key, photoFiles, photosLoaded]);

  /** Throws the draft away and starts a blank listing. */
  const discardDraft = () => {
    clearDraft(key);
    setForm(initialFormData);
    setStep(1);
    setCoordinates(null);
    setPhotoFiles([]);
    setTenancyAgreement(null);
    setError(null);
    setRestoredDraft(null);
  };

  const setField = useCallback(<K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleField = (field: BooleanField) => setForm((prev) => ({ ...prev, [field]: !prev[field] }));

  const toggleInList = (field: 'amenities' | 'availableDays' | 'availableTimeSlots', value: string) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }));

  const addTimeSlot = (input: string): boolean => {
    const slot = formatTimeSlot(input);
    if (!slot) return false;
    setForm((prev) => (prev.availableTimeSlots.includes(slot) ? prev : { ...prev, availableTimeSlots: [...prev.availableTimeSlots, slot] }));
    return true;
  };

  const addShortletRate = () =>
    setForm((prev) => ({ ...prev, shortletRates: [...prev.shortletRates, { label: '', durationValue: '1', durationUnit: 'day', price: '' }] }));

  const updateShortletRate = (index: number, field: keyof ShortletRateForm, value: string) =>
    setForm((prev) => ({
      ...prev,
      shortletRates: prev.shortletRates.map((rate, i) => (i === index ? { ...rate, [field]: value } : rate)),
    }));

  const removeShortletRate = (index: number) =>
    setForm((prev) => ({ ...prev, shortletRates: prev.shortletRates.filter((_, i) => i !== index) }));

  const addPhotos = async (files: File[]) => {
    // Videos too big for the 100MB limit, or not MP4/MOV, are re-encoded to a smaller MP4 first.
    const ready: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('video/') || canSendAsIs(file) || !browserCanCompress()) {
        ready.push(file);
        continue;
      }
      setShrinking({ name: file.name, progress: 0 });
      try {
        ready.push(await compressVideo(file, { onProgress: (f) => setShrinking({ name: file.name, progress: Math.round(f * 100) }) }));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setShrinking(null);
      }
    }
    setPhotoFiles((current) => {
      const { accepted, problem } = selectPhotos(current, ready);
      if (problem) setError(problem);
      return accepted;
    });
  };

  const removePhoto = (index: number) => setPhotoFiles((prev) => prev.filter((_, i) => i !== index));

  const next = () => {
    if (shrinking) {
      setError('Please wait: a video is still being shrunk to fit the upload limit.');
      return;
    }
    const current = stepAt(step);
    const problem = current
      ? current.key === 'photos' ? validateMedia(photoFiles) : validateStep(current.key, form)
      : null;
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const submit = async () => {
    if (shrinking) {
      setError('Please wait: a video is still being shrunk to fit the upload limit.');
      return;
    }
    const problem = validateForSubmit(form) ?? validateMedia(photoFiles);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.createListing(buildListingPayload(form, { coordinates, tenancyAgreement }));
      if (!created.success) {
        setError(describeSubmitError(created.error));
        return;
      }
      // The listing exists now; a leftover draft would invite publishing it twice.
      published.current = true;
      clearDraft(key);
      if (photoFiles.length > 0) {
        setUploading(true);
        const uploaded = await api.uploadListingImages(created.data._id, photoFiles);
        if (!uploaded.success) {
          // The listing exists; say so rather than leaving the lister to publish it twice.
          setError(`Listing created, but the photos and videos failed to upload: ${uploaded.error.message}`);
          return;
        }
      }
      onPublished();
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return {
    step,
    stepTitle: stepAt(step)?.title ?? '',
    totalSteps: TOTAL_STEPS,
    form,
    setField,
    toggleField,
    toggleInList,
    addTimeSlot,
    addShortletRate,
    updateShortletRate,
    removeShortletRate,
    setCoordinates,
    photoFiles,
    addPhotos,
    removePhoto,
    tenancyAgreement,
    setTenancyAgreement,
    error,
    submitting,
    uploading,
    shrinking,
    next,
    back,
    submit,
    restoredDraft,
    dismissRestoredNotice: () => setRestoredDraft(null),
    discardDraft,
  };
}

export type ListingWizard = ReturnType<typeof useListingWizard>;
