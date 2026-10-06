/**
 * Which state the company Settings "Company Documents" card is in, from GET /company/profile.
 *
 * BUGFIX (company QA): the card read `company.documentsSubmitted`, which the profile endpoint
 * never returned, so a company that had already submitted saw the upload form again after
 * every reload. Once the field arrived, a REJECTED company (documentsSubmitted stays true)
 * would have been told "under review" forever; it must see the reason and be able to resubmit.
 */
export type CompanyDocumentsState = 'verified' | 'under_review' | 'rejected' | 'upload';

export interface CompanyVerificationFacts {
  status?: string | null;
  documentsSubmitted?: boolean | null;
}

/** `submittedThisSession` is true right after a successful upload, before the profile reloads. */
export function companyDocumentsState(
  company: CompanyVerificationFacts | null | undefined,
  submittedThisSession = false
): CompanyDocumentsState {
  if (company?.status === 'verified') return 'verified';
  if (submittedThisSession) return 'under_review';
  if (company?.status === 'rejected') return 'rejected';
  if (company?.documentsSubmitted) return 'under_review';
  return 'upload';
}
