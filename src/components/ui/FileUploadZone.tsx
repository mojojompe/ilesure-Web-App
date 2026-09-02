import { useRef, useState } from 'react';
import { Upload, X, File as FileIcon, AlertCircle, Camera } from 'lucide-react';

export interface FileState {
  file: File | null;
  name: string;
  size: string;
  error: string;
  /** Optional object URL for image previews. */
  previewUrl?: string;
}

export function makeFileState(): FileState {
  return { file: null, name: '', size: '', error: '' };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const DOCUMENT_TYPES = ['application/pdf', ...IMAGE_TYPES];
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates a picked file against an allow-list of MIME types and a size cap and
 * returns the resulting FileState. Never leaves an invalid file in state, so a
 * wrong-type document (e.g. a CV in the CAC slot) is rejected inline (QA-AGT-002).
 */
export function validateFile(f: File, allowedTypes: string[], maxSize = MAX_UPLOAD_SIZE): FileState {
  const isAllowed = allowedTypes.includes(f.type);
  if (!isAllowed) {
    const label = allowedTypes.includes('application/pdf') ? 'PDF, JPG or PNG' : 'JPG or PNG';
    return { file: null, name: '', size: '', error: `Invalid file type. Please upload a ${label} file.` };
  }
  if (f.size > maxSize) {
    return { file: null, name: '', size: '', error: `File is too large. Max ${formatBytes(maxSize)}.` };
  }
  return {
    file: f,
    name: f.name,
    size: formatBytes(f.size),
    error: '',
    previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
  };
}

interface FileUploadZoneProps {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  fileState: FileState;
  onFile: (file: File) => void;
  onClear: () => void;
  accept: string;
  /** Use the device camera (mobile) — for live selfies. */
  capture?: 'user' | 'environment';
  icon?: 'upload' | 'camera';
}

export function FileUploadZone({
  id, label, hint, required, fileState, onFile, onClear, accept, capture, icon = 'upload',
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const Icon = icon === 'camera' ? Camera : Upload;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {fileState.file ? (
        <div className="flex items-center gap-3 p-4 bg-status-success/5 border border-status-success/30 rounded-clay-sm">
          {fileState.previewUrl ? (
            <img src={fileState.previewUrl} alt={fileState.name} className="w-10 h-10 rounded-clay-sm object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-clay-sm bg-status-success/10 flex items-center justify-center flex-shrink-0">
              <FileIcon className="w-5 h-5 text-status-success" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{fileState.name}</p>
            <p className="text-xs text-text-tertiary">{fileState.size} · attached</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${label}`}
            className="p-1.5 rounded-full hover:bg-clay-border-light transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`border-2 border-dashed rounded-clay-sm p-6 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-mustard bg-mustard-pale'
              : fileState.error
              ? 'border-red-400 bg-red-50'
              : 'border-clay-border bg-clay-border-light hover:border-mustard hover:bg-mustard-pale/40'
          }`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Icon className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary font-medium">
            {icon === 'camera' ? 'Tap to take a photo or ' : 'Drop file here or '}
            <span className="text-mustard">click to upload</span>
          </p>
          {hint && <p className="text-xs text-text-tertiary mt-1">{hint}</p>}
        </div>
      )}

      {fileState.error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {fileState.error}
        </p>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        capture={capture}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default FileUploadZone;
