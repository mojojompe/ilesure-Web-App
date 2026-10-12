/**
 * What a lister still has to do before they can publish and be paid: accept the current
 * Platform Listing Agreement, and have a payout account for Paystack to settle rent into.
 * The server decides both (GET /contracts/status); this module only reads and submits.
 */
import apiClient from './client';
import { toApiFailure } from './apiError';

export interface ListerRequirements {
  /** The agreement version listers must have accepted. */
  currentVersion: string;
  /** The version this lister accepted, or null if never. */
  acceptedVersion: string | null;
  requiresListingAgreement: boolean;
  /** False when rent for this lister's listings has no payout account to be settled into. */
  payoutAccountReady: boolean;
}

export interface ListingAgreementDocument {
  title: string;
  body: string;
  version: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: { message: string; code?: string } };

export const listerRequirementsApi = {
  async get(): Promise<Result<ListerRequirements>> {
    try {
      const res = await apiClient.get<{ data: ListerRequirements }>('/contracts/status');
      return { success: true, data: res.data.data };
    } catch (err) {
      return toApiFailure(err, 'Could not load your account requirements.');
    }
  },

  async getAgreement(): Promise<Result<ListingAgreementDocument>> {
    try {
      const res = await apiClient.get<{ data: ListingAgreementDocument }>(
        '/contracts/platform/document?contractType=PLATFORM_LISTING_AGREEMENT'
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      return toApiFailure(err, 'Could not load the agreement. Please try again.');
    }
  },

  /** Accept `version` (the one shown to the lister) by typing their full name. */
  async acceptAgreement(fullName: string, version: string): Promise<Result<ListerRequirements>> {
    try {
      const res = await apiClient.post<{ data: ListerRequirements }>('/contracts/platform/accept', { fullName, version });
      return { success: true, data: res.data.data };
    } catch (err) {
      return toApiFailure(err, 'Could not record your acceptance. Please try again.');
    }
  },
};
