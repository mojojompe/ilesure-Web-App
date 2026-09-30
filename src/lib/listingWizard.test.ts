import { describe, it, expect } from 'vitest';
import {
  initialFormData,
  validateStep,
  validateForSubmit,
  buildListingPayload,
  selectPhotos,
  formatTimeSlot,
  isVerifiedToList,
  describeSubmitError,
  STEPS,
  type ListingFormData,
} from './listingWizard';

const complete: ListingFormData = {
  ...initialFormData,
  title: 'Modern self-con',
  description: 'Near the gate',
  address: '12 Road',
  city: 'Ibadan',
  area: 'Bodija',
  annualRent: '250000',
};

describe('step order', () => {
  it('asks for the property type before pricing', () => {
    expect(STEPS.map((s) => s.key)).toEqual([
      'basics', 'location', 'property', 'pricing', 'furnishing', 'utilities', 'rules', 'photos', 'review',
    ]);
  });
});

describe('validateStep', () => {
  it('does not demand rent on the property-type step (the copies did, trapping the lister)', () => {
    expect(validateStep('property', { ...complete, annualRent: '' })).toBeNull();
  });

  it('requires a title and description', () => {
    expect(validateStep('basics', { ...complete, title: '  ' })).toBe('Please give the listing a title.');
    expect(validateStep('basics', { ...complete, description: '' })).toBe('Please add a description.');
  });

  it('requires address, city and area', () => {
    expect(validateStep('location', { ...complete, area: '' })).toBe('Please enter the area or cluster.');
  });

  it('requires at least one occupant', () => {
    expect(validateStep('property', { ...complete, maxOccupants: '0' })).toBe('Maximum occupants must be at least 1.');
  });

  it.each([
    ['', 'Please enter the annual rent.'],
    ['-50000', 'Annual rent must be at least ₦10,000.'],
    ['9999', 'Annual rent must be at least ₦10,000.'],
  ])('rejects rent %j', (rent, message) => {
    expect(validateStep('pricing', { ...complete, annualRent: rent })).toBe(message);
  });

  it('rejects negative caution and agency fees (company copy lacked this)', () => {
    expect(validateStep('pricing', { ...complete, cautionFee: '-1' })).toBe('Caution fee cannot be negative.');
    expect(validateStep('pricing', { ...complete, agencyFee: '-5' })).toBe('Agency fee cannot be negative.');
    expect(validateStep('pricing', { ...complete, cautionFee: '0', agencyFee: '' })).toBeNull();
  });

  it('needs a shortlet tier instead of rent for shortlets', () => {
    const shortlet = { ...complete, propertyType: 'shortlet' as const, annualRent: '' };
    expect(validateStep('pricing', shortlet)).toBe('Add at least one shortlet rate.');
    expect(validateStep('pricing', { ...shortlet, shortletRates: [{ label: 'Day', durationValue: '1', durationUnit: 'day', price: '5' }] })).toBeNull();
  });
});

describe('validateForSubmit', () => {
  it('passes a complete rental', () => {
    expect(validateForSubmit(complete)).toBeNull();
  });

  it('rejects a shortlet whose only tier is incomplete', () => {
    const form = { ...complete, propertyType: 'shortlet' as const, shortletRates: [{ label: '', durationValue: '1', durationUnit: 'day' as const, price: '5' }] };
    expect(validateForSubmit(form)).toBe('Add at least one shortlet pricing tier (label, duration, and price).');
  });
});

describe('buildListingPayload', () => {
  it('maps a rental form to the create body', () => {
    const payload = buildListingPayload(
      { ...complete, cautionFee: '50000', leaseDurationValue: '2', petsAllowed: true, studentsOnly: true },
      { coordinates: [3.9, 7.4] }
    );
    expect(payload).toMatchObject({
      title: 'Modern self-con',
      rentAnnual: 250000,
      cautionFee: 50000,
      agencyFee: undefined,
      areaCluster: 'Bodija',
      leaseDurationValue: 2,
      leaseDuration: '2 years',
      rules: ['pets_allowed', 'students_only'],
      location: { type: 'Point', coordinates: [3.9, 7.4] },
      images: [],
    });
    expect(payload).not.toHaveProperty('tenancyAgreement');
  });

  it('always sends inspection availability, falling back to defaults when cleared', () => {
    const payload = buildListingPayload({ ...complete, availableDays: [], availableTimeSlots: [], inspectionNotes: '' });
    expect(payload.inspectionAvailability).toEqual({
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
      notes: 'Inspections available Mon-Sat 9am to 4pm',
    });
    const custom = buildListingPayload({ ...complete, availableDays: ['Sunday'], availableTimeSlots: ['10:00 AM'], inspectionNotes: 'Call first' });
    expect(custom.inspectionAvailability).toEqual({ availableDays: ['Sunday'], timeSlots: ['10:00 AM'], notes: 'Call first' });
  });

  it('zeroes rent, drops the lease and keeps only complete tiers for shortlets', () => {
    const payload = buildListingPayload({
      ...complete,
      propertyType: 'shortlet',
      shortletRates: [
        { label: ' Full Day ', durationValue: '1', durationUnit: 'day', price: '100000' },
        { label: 'Broken', durationValue: '0', durationUnit: 'day', price: '5' },
      ],
    });
    expect(payload).toMatchObject({ rentAnnual: 0, leaseDuration: undefined, leaseDurationUnit: undefined });
    expect(payload.shortletRates).toEqual([{ label: 'Full Day', durationValue: 1, durationUnit: 'day', price: 100000 }]);
  });

  it('includes a custom tenancy agreement only when one was uploaded', () => {
    const doc = { url: 'u', fileName: 'lease.pdf', mimeType: 'application/pdf', fileSize: 10 };
    expect(buildListingPayload(complete, { tenancyAgreement: doc }).tenancyAgreement).toEqual(doc);
  });
});

describe('selectPhotos', () => {
  const photo = (name: string, type = 'image/jpeg', size = 1000) => ({ name, type, size }) as File;

  it('keeps valid images and reports the first rejection', () => {
    const { accepted, problem } = selectPhotos([], [photo('a.jpg'), photo('b.gif', 'image/gif'), photo('c.png', 'image/png', 6 * 1024 * 1024)]);
    expect(accepted.map((f) => f.name)).toEqual(['a.jpg']);
    expect(problem).toBe('b.gif is not a JPEG, PNG, or WEBP image.');
  });

  it('caps the set at six photos', () => {
    const current = Array.from({ length: 5 }, (_, i) => photo(`${i}.jpg`));
    const { accepted } = selectPhotos(current, [photo('x.jpg'), photo('y.jpg')]);
    expect(accepted).toHaveLength(6);
  });
});

describe('small helpers', () => {
  it('formats typed time slots', () => {
    expect(formatTimeSlot(' 10:00 am ')).toBe('10:00 AM');
    expect(formatTimeSlot('   ')).toBeNull();
  });

  it('matches the backend verification gate for listers', () => {
    expect(isVerifiedToList({ verificationStatus: 'verified' }, 'company')).toBe(true);
    expect(isVerifiedToList({ ninVerified: true, bvnVerified: false }, 'company')).toBe(false);
    expect(isVerifiedToList({ ninVerified: true, bvnVerified: true, role: 'agent' }, 'company')).toBe(true);
  });

  it('joins a server message with its field details', () => {
    expect(describeSubmitError({ message: 'Invalid', details: ['title required'] })).toBe('Invalid · title required');
    expect(describeSubmitError(undefined)).toBe('Failed to create listing');
  });
});
