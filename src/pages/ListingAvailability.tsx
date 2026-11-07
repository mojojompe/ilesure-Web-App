import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckmarkBadge02Icon, Archive01Icon, AlertCircleIcon } from '@hugeicons/react';
import { Button } from '../components/ui/Button';
import apiClient from '../api/client';
import { getApiErrorMessage } from '../api/apiError';

/**
 * Landing page for the "Is this listing still available?" email. The email's Yes/No buttons
 * open this page with ?answer=yes|no preselected; nothing changes until the lister confirms
 * here, because mail scanners open every link in a message. No sign-in needed: the token in
 * the URL is the credential.
 */
interface CheckInfo {
  listing: { title: string; areaCluster: string | null; image: string | null; status: string };
  deadline: string;
}
interface AnswerResult {
  answer: 'yes' | 'no';
  status: string;
  title: string;
  archivedUrl: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function ListingAvailabilityPage() {
  const { token = '' } = useParams();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('answer') === 'no' ? 'no' : 'yes';

  const [info, setInfo] = useState<CheckInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState<'yes' | 'no' | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ success: boolean; data: CheckInfo }>(`/listings/availability-check/${encodeURIComponent(token)}`)
      .then(res => { if (!cancelled) setInfo(res.data.data); })
      .catch(err => { if (!cancelled) setLoadError(getApiErrorMessage(err, 'This link has expired or has already been used.')); });
    return () => { cancelled = true; };
  }, [token]);

  const answer = async (value: 'yes' | 'no') => {
    setSubmitting(value);
    setSubmitError('');
    try {
      const res = await apiClient.post<{ success: boolean; data: AnswerResult }>(
        `/listings/availability-check/${encodeURIComponent(token)}`,
        { answer: value },
      );
      setResult(res.data.data);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(null);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-clay overflow-hidden shadow-clay">
            <img src="/NoBG Logo.png" alt="iléSure" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="clay-card p-6">{children}</div>
      </div>
    </div>
  );

  if (result) {
    const kept = result.answer === 'yes';
    return shell(
      <div className="text-center">
        <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${kept ? 'bg-status-success/10' : 'bg-mustard-pale'}`}>
          {kept
            ? <CheckmarkBadge02Icon className="w-7 h-7 text-status-success" />
            : <Archive01Icon className="w-7 h-7 text-text-primary" />}
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {kept ? 'Thanks, your listing stays live' : 'Listing moved to your archive'}
        </h1>
        <p className="text-text-tertiary text-sm mb-6">
          {kept
            ? <>We'll check in again about <strong>{result.title}</strong> in two weeks.</>
            : <>Renters can no longer see <strong>{result.title}</strong>. If it becomes available again, you can restore it from your archive.</>}
        </p>
        {!kept && (
          <a href={result.archivedUrl}>
            <Button variant="primary" className="w-full">Go to my archive</Button>
          </a>
        )}
      </div>,
    );
  }

  if (loadError) {
    return shell(
      <div className="text-center">
        <AlertCircleIcon className="w-10 h-10 mx-auto mb-3 text-text-tertiary" />
        <h1 className="text-lg font-bold text-text-primary mb-2">This link can't be used</h1>
        <p className="text-text-tertiary text-sm">{loadError} You can manage your listings from your dashboard at any time.</p>
      </div>,
    );
  }

  if (!info) {
    return shell(<p className="text-center text-text-tertiary text-sm">Loading…</p>);
  }

  const yesFirst = preselected === 'yes';
  const yesButton = (
    <Button
      key="yes"
      variant={yesFirst ? 'primary' : 'secondary'}
      className="w-full"
      disabled={submitting !== null}
      onClick={() => answer('yes')}
    >
      {submitting === 'yes' ? 'Saving…' : "Yes, it's still available"}
    </Button>
  );
  const noButton = (
    <Button
      key="no"
      variant={yesFirst ? 'secondary' : 'danger'}
      className="w-full"
      disabled={submitting !== null}
      onClick={() => answer('no')}
    >
      {submitting === 'no' ? 'Saving…' : "No, it's taken. Move it to my archive"}
    </Button>
  );

  return shell(
    <div>
      {info.listing.image && (
        <img src={info.listing.image} alt="" className="w-full h-40 object-cover rounded-md mb-4" />
      )}
      <h1 className="text-xl font-bold text-text-primary mb-1">Is this listing still available?</h1>
      <p className="text-text-primary font-semibold">{info.listing.title}</p>
      {info.listing.areaCluster && <p className="text-text-tertiary text-sm">{info.listing.areaCluster}</p>}
      <p className="text-text-tertiary text-sm mt-4 mb-6">
        If we don't hear from you by <strong>{formatDate(info.deadline)}</strong>, it will be moved to your archive.
      </p>
      {submitError && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-md">
          <p className="text-sm text-status-error text-center">{submitError}</p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {yesFirst ? [yesButton, noButton] : [noButton, yesButton]}
      </div>
    </div>,
  );
}
