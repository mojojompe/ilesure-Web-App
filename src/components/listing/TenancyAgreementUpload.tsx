import { useRef, useState } from 'react';
import { FileText, Upload, X, Loader2, CheckCircle } from 'lucide-react';
import agentApi, { TenancyAgreementDocument } from '../../api/agent';

interface TenancyAgreementUploadProps {
  value: TenancyAgreementDocument | null;
  onChange: (document: TenancyAgreementDocument | null) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Lets a landlord, agent or company attach their own tenancy agreement to a listing.
 *
 * Tenancy terms are not interchangeable between properties, so the document
 * uploaded here becomes the agreement the tenant reads and signs for this
 * property, in place of the platform's standard template.
 *
 * The file is uploaded immediately and the returned metadata is held in form
 * state, because the listing does not exist yet at this point in the wizard.
 */
export function TenancyAgreementUpload({ value, onChange }: TenancyAgreementUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    event.target.value = '';
    if (!file) return;

    setError('');

    if (file.type !== 'application/pdf') {
      setError('The tenancy agreement must be a PDF file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('The tenancy agreement must be 10MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await agentApi.uploadTenancyAgreement(file);
      onChange(uploaded);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          'Could not upload the tenancy agreement. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        Tenancy Agreement (Optional)
      </label>

      {value ? (
        <div className="clay-card p-4 flex items-start gap-3 bg-clay-surface">
          <CheckCircle className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{value.fileName}</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              {formatSize(value.fileSize)}
              {value.pageCount ? ` · ${value.pageCount} page${value.pageCount > 1 ? 's' : ''}` : ''}
            </p>
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-mustard hover:underline mt-1 inline-block"
            >
              Preview document
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError('');
            }}
            aria-label="Remove tenancy agreement"
            className="w-7 h-7 rounded-full bg-clay-border-light hover:bg-clay-border flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-clay-sm border-2 border-dashed border-clay-border hover:border-mustard transition-colors bg-clay-border-light p-6 flex flex-col items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" />
              <span className="text-sm text-text-secondary">Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-text-tertiary" />
              <span className="text-sm font-medium text-text-secondary">Upload tenancy agreement</span>
              <span className="text-xs text-text-tertiary">PDF, up to 10MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleSelect}
        className="hidden"
      />

      {error && <p className="text-xs text-status-error mt-2">{error}</p>}

      <div className="flex items-start gap-2 mt-3">
        <FileText className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
        <p className="text-xs text-text-tertiary">
          Attach your own agreement for this property and tenants will review and sign it
          instead of the standard iléSure template. A signature page is added at the end for
          the electronic signatures. Leave this empty to use the standard template.
        </p>
      </div>
    </div>
  );
}
