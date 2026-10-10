import { describe, it, expect } from 'vitest';
import { parseDraft, hasProgress, describeSavedAt, draftKey } from './listingDraft';
import { initialFormData } from './listingWizard';

describe('hasProgress', () => {
  it('is false for an untouched form', () => {
    expect(hasProgress(initialFormData)).toBe(false);
  });
  it('is true once a field changes, a photo is added or an agreement uploaded', () => {
    expect(hasProgress({ ...initialFormData, title: 'Self-con' })).toBe(true);
    expect(hasProgress(initialFormData, 1)).toBe(true);
    expect(hasProgress(initialFormData, 0, true)).toBe(true);
  });
});

describe('parseDraft', () => {
  const stored = (over: Record<string, unknown> = {}) =>
    JSON.stringify({ version: 1, savedAt: '2026-10-08T10:00:00.000Z', step: 4, form: { title: 'Self-con' }, coordinates: [3.9, 7.4], tenancyAgreement: null, ...over });

  it('restores the step and fills fields the draft lacks with defaults', () => {
    const d = parseDraft(stored())!;
    expect(d.step).toBe(4);
    expect(d.form.title).toBe('Self-con');
    expect(d.form.paymentFrequency).toBe(initialFormData.paymentFrequency);
    expect(d.coordinates).toEqual([3.9, 7.4]);
  });
  it('rejects missing, corrupt or old-version drafts', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('{not json')).toBeNull();
    expect(parseDraft(stored({ version: 0 }))).toBeNull();
    expect(parseDraft(stored({ form: null }))).toBeNull();
  });
  it('falls back to step 1 when the stored step is out of range', () => {
    expect(parseDraft(stored({ step: 99 }))!.step).toBe(1);
  });
});

describe('draftKey', () => {
  it('is separate per role and user', () => {
    expect(draftKey('agent', 'u1')).not.toBe(draftKey('company', 'u1'));
    expect(draftKey('agent', 'u1')).not.toBe(draftKey('agent', 'u2'));
  });
});

describe('describeSavedAt', () => {
  const now = new Date('2026-10-08T12:00:00.000Z');
  it('reads naturally', () => {
    expect(describeSavedAt('2026-10-08T11:59:40.000Z', now)).toBe('just now');
    expect(describeSavedAt('2026-10-08T11:55:00.000Z', now)).toBe('5 minutes ago');
    expect(describeSavedAt('2026-10-08T09:00:00.000Z', now)).toBe('3 hours ago');
  });
});
