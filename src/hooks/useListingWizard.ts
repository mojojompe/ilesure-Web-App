import { useCallback, useState } from 'react';
import { ownerApi, type OwnerRole, type TenancyAgreementDocument } from '../api/owner';
import {
  initialFormData,
  stepAt,
  TOTAL_STEPS,
  validateStep,
  validateForSubmit,
  buildListingPayload,
  selectPhotos,
  formatTimeSlot,
  describeSubmitError,
  type ListingFormData,
  type ShortletRateForm,
} from '../lib/listingWizard';

type BooleanField = { [K in keyof ListingFormData]: ListingFormData[K] extends boolean ? K : never }[keyof ListingFormData];

/**
 * State and actions for the Create Listing wizard. The page renders; this owns the form,
 * step navigation, photo/agreement selection and publishing through the owner API.
 * `onPublished` runs after the listing (and its photos) are saved.
 */
export function useListingWizard(role: OwnerRole, onPublished: () => void) {
  const api = ownerApi(role);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormData>(initialFormData);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [tenancyAgreement, setTenancyAgreement] = useState<TenancyAgreementDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const addPhotos = (files: File[]) => {
    const { accepted, problem } = selectPhotos(photoFiles, files);
    if (problem) setError(problem);
    setPhotoFiles(accepted);
  };

  const removePhoto = (index: number) => setPhotoFiles((prev) => prev.filter((_, i) => i !== index));

  const next = () => {
    const current = stepAt(step);
    const problem = current ? validateStep(current.key, form) : null;
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const submit = async () => {
    const problem = validateForSubmit(form);
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
      if (photoFiles.length > 0) {
        setUploading(true);
        const uploaded = await api.uploadListingImages(created.data._id, photoFiles);
        if (!uploaded.success) {
          // The listing exists; say so rather than leaving the lister to publish it twice.
          setError(`Listing created, but the photos failed to upload: ${uploaded.error.message}`);
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
    next,
    back,
    submit,
  };
}

export type ListingWizard = ReturnType<typeof useListingWizard>;
