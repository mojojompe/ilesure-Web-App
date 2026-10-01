import { describe, it, expect } from 'vitest';
import { companyDocumentsState } from './companyVerification';

describe('companyDocumentsState', () => {
  it('shows the upload form when nothing was submitted', () => {
    expect(companyDocumentsState({ status: 'pending', documentsSubmitted: false })).toBe('upload');
    expect(companyDocumentsState(null)).toBe('upload');
  });

  it('remembers a submission across reloads (documentsSubmitted from the profile)', () => {
    expect(companyDocumentsState({ status: 'pending', documentsSubmitted: true })).toBe('under_review');
  });

  it('a rejected company is asked to resubmit, not told it is under review', () => {
    expect(companyDocumentsState({ status: 'rejected', documentsSubmitted: true })).toBe('rejected');
  });

  it('a resubmission in this session reads as under review until the profile reloads', () => {
    expect(companyDocumentsState({ status: 'rejected', documentsSubmitted: true }, true)).toBe('under_review');
  });

  it('verified wins', () => {
    expect(companyDocumentsState({ status: 'verified', documentsSubmitted: true }, true)).toBe('verified');
  });
});
