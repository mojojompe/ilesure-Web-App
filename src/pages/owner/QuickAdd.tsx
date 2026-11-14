import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Alert01Icon, Cancel02Icon, FlashIcon, Loading02Icon, Tick02Icon, Upload01Icon, Video01Icon, Camera01Icon, Delete02Icon, StarIcon,
} from '@hugeicons/react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../api/authContext';
import { userApi } from '../../api/user';
import { ownerApi, type OwnerRole } from '../../api/owner';
import { buildListingPayload, describeSubmitError, isVerifiedToList, MAX_MEDIA, MIN_PHOTOS, ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE_BYTES, type ListingFormData } from '../../lib/listingWizard';
import { parseListingMessage } from '../../lib/whatsappListingParser';
import { extractFrames, grabFrame, pickBestFrames, releaseFrames, type VideoFrame } from '../../lib/videoFrames';
import { saveDraftPhotos, loadDraftPhotos } from '../../lib/listingDraft';
import { canSendAsIs, compressVideo } from '../../lib/videoCompress';
import {
  cardsFromMessage, cardMedia, cardProblem, cardsKey, cardPhotosKey, defaultsKey, loadDefaults, saveDefaults,
  loadStoredCards, saveStoredCards, splitMedia, REMEMBERED_FIELDS, type QuickCard, type QuickDefaults, type RememberedField,
} from '../../lib/quickAdd';
import {
  amenityOptions, distanceOptions, furnishingOptions, genderOptions, powerOptions, propertyTypes, waterOptions, type Option,
} from '../../constants/listingVocabulary';

const labelClass = 'block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5';
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(bytes < 10 * 1048576 ? 1 : 0)}MB`;
const naira = (v: string | number) => (v === '' || !Number.isFinite(Number(v)) ? '' : `₦${Number(v).toLocaleString()}`);

// ---------------------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------------------

function Chips<V extends string>({ options, value, onChange, guessed }: {
  options: readonly Option<V>[];
  value: V;
  onChange: (v: V) => void;
  guessed?: boolean;
}) {
  return (
    <div className={clsx('flex flex-wrap gap-1.5 rounded-clay-sm', guessed && 'outline-dashed outline-2 outline-offset-4 outline-mustard/60')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={clsx(
            'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
            value === o.value ? 'border-mustard bg-mustard-pale text-mustard' : 'border-clay-border text-text-secondary hover:border-mustard'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ children, guessed }: { children: React.ReactNode; guessed?: boolean }) {
  return (
    <span className={labelClass}>
      {children}
      {guessed && <span className="ml-2 normal-case tracking-normal font-medium text-mustard">· not in message, please check</span>}
    </span>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-clay-sm bg-status-error/10 p-3 text-sm text-status-error">
      <Alert01Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function Thumb({ file, onRemove, onCover, isCover }: { file: File; onRemove: () => void; onCover?: () => void; isCover?: boolean }) {
  // Created in the effect (not useMemo) so StrictMode's mount-unmount-mount cannot leave the
  // thumbnail pointing at a URL its own cleanup already revoked.
  const [url, setUrl] = useState('');
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  const isVideo = file.type.startsWith('video/');
  return (
    <div className="relative w-20 h-20 shrink-0 rounded-clay-sm overflow-hidden bg-clay-border/40 group">
      {url && (isVideo ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} alt="" className="w-full h-full object-cover" />)}
      {isVideo && <Video01Icon className="absolute bottom-1 left-1 w-4 h-4 text-white drop-shadow" />}
      {isCover && <span className="absolute bottom-0 inset-x-0 bg-mustard text-white text-[10px] text-center font-semibold">Cover</span>}
      <button type="button" onClick={onRemove} aria-label="Remove" className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
        <Cancel02Icon className="w-3 h-3" />
      </button>
      {onCover && !isCover && !isVideo && (
        <button type="button" onClick={onCover} aria-label="Make cover photo" title="Make cover photo" className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white items-center justify-center hidden group-hover:flex">
          <StarIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Composer: paste the post, drop the media, pick frames
// ---------------------------------------------------------------------------------------

interface VideoState {
  file: File;
  url: string;
  frames: VideoFrame[];
  selected: string[];
  loading: boolean;
  progress: number;
  error?: string;
  /** The file that will be attached: the original when it already fits, or the shrunk copy. */
  uploadFile: File | null;
  shrinking: boolean;
  shrinkProgress: number;
  shrinkError?: string;
  abort: AbortController;
}

function Composer({ defaults, onCreate }: { defaults: QuickDefaults; onCreate: (cards: QuickCard[]) => void }) {
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<VideoState | null>(null);
  const [attachVideo, setAttachVideo] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<VideoState | null>(null);
  videoRef.current = video;

  useEffect(() => () => {
    if (videoRef.current) {
      releaseFrames(videoRef.current.frames);
      URL.revokeObjectURL(videoRef.current.url);
    }
  }, []);

  const parsed = useMemo(() => (text.trim() ? parseListingMessage(text) : null), [text]);

  const clearVideo = () => {
    if (video) {
      video.abort.abort();
      releaseFrames(video.frames);
      URL.revokeObjectURL(video.url);
    }
    setVideo(null);
  };

  const loadVideo = async (file: File) => {
    clearVideo();
    const asIs = canSendAsIs(file);
    const state: VideoState = {
      file, url: URL.createObjectURL(file), frames: [], selected: [], loading: true, progress: 0,
      uploadFile: asIs ? file : null, shrinking: false, shrinkProgress: 0, abort: new AbortController(),
    };
    setVideo(state);
    setAttachVideo(true);
    const mine = (v: VideoState | null) => Boolean(v && v.file === file);
    try {
      const frames = await extractFrames(file, {
        onUpdate: (frames, done, total) =>
          setVideo((v) => (v && v.file === file ? { ...v, frames, progress: Math.round((done / total) * 100) } : v)),
      });
      setVideo((v) => (v && v.file === file ? { ...v, frames, loading: false, selected: pickBestFrames(frames, 6) } : v));
    } catch (e) {
      setVideo((v) => (v && v.file === file ? { ...v, loading: false, error: (e as Error).message } : v));
    }
    // Frames first (quick), then shrink the video for upload if it is too big or not MP4/MOV.
    if (asIs || state.abort.signal.aborted) return;
    setVideo((v) => (mine(v) ? { ...v!, shrinking: true } : v));
    try {
      const small = await compressVideo(file, {
        signal: state.abort.signal,
        onProgress: (f) => setVideo((v) => (mine(v) ? { ...v!, shrinkProgress: Math.round(f * 100) } : v)),
      });
      setVideo((v) => (mine(v) ? { ...v!, shrinking: false, uploadFile: small } : v));
    } catch (e) {
      if (state.abort.signal.aborted) return;
      setVideo((v) => (mine(v) ? { ...v!, shrinking: false, shrinkError: (e as Error).message } : v));
    }
  };

  const addFiles = (files: File[]) => {
    setProblem(null);
    const vid = files.find((f) => f.type.startsWith('video/'));
    if (vid) void loadVideo(vid);
    const images = files.filter((f) => f.type.startsWith('image/'));
    const ok = images.filter((f) => ALLOWED_PHOTO_TYPES.includes(f.type) && f.size <= MAX_PHOTO_SIZE_BYTES);
    if (ok.length < images.length) setProblem('Some photos were skipped: only JPEG, PNG or WEBP up to 5MB.');
    setPhotos((prev) => [...prev, ...ok].slice(0, MAX_MEDIA));
  };

  const toggleFrame = (id: string) =>
    setVideo((v) => v && { ...v, selected: v.selected.includes(id) ? v.selected.filter((s) => s !== id) : [...v.selected, id] });

  const grabCurrent = async () => {
    const el = previewRef.current;
    if (!el || !video) return;
    el.pause();
    try {
      const frame = await grabFrame(el, el.currentTime, video.file.name.replace(/\.[^.]+$/, ''));
      setVideo((v) => v && { ...v, frames: [...v.frames, frame].sort((a, b) => a.time - b.time), selected: [...v.selected, frame.id] });
    } catch {
      setProblem("Couldn't grab that moment. Try pausing a little later.");
    }
  };

  const selectedFrames = video ? video.frames.filter((f) => video.selected.includes(f.id)).map((f) => f.file) : [];
  const videoToAttach = video && attachVideo ? video.uploadFile : null;
  const waitingForVideo = Boolean(video && attachVideo && video.shrinking);
  const allPhotos = [...photos, ...selectedFrames];
  const room = MAX_MEDIA - (videoToAttach ? 1 : 0);
  const overLimit = allPhotos.length > room;

  const create = () => {
    if (!parsed) {
      setProblem('Paste the message first.');
      return;
    }
    if (waitingForVideo) {
      setProblem('The video is still being shrunk. Wait for it, or untick "attach the video" to use only the photos.');
      return;
    }
    if (overLimit) {
      setProblem(`A listing can hold ${MAX_MEDIA} photos and videos. Untick ${allPhotos.length - room} to continue.`);
      return;
    }
    onCreate(cardsFromMessage(parsed, defaults, { photos: allPhotos, video: videoToAttach }));
    setText('');
    setPhotos([]);
    clearVideo();
    setProblem(null);
  };

  return (
    <div className="clay-card p-5 space-y-4">
      <div>
        <label htmlFor="qa-text" className={labelClass}>1. Paste the agent's message</label>
        <textarea
          id="qa-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={'e.g. Direct letting, 5 unit of Room self con and 1 unit of Room and palour self con, Toll gate very close to Lead City University\nRent 800k\nRoom and palour 1.2m'}
          className="clay-input w-full resize-y text-sm"
        />
        {parsed && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {parsed.units.map((u) => (
              <span key={u.propertyType} className="px-2 py-1 rounded-full bg-mustard-pale text-mustard font-medium">
                {u.label}{u.count && u.count > 1 ? ` ×${u.count}` : ''}{u.rent ? ` · ${naira(u.rent)}` : ' · no price'}
              </span>
            ))}
            {parsed.area && <span className="px-2 py-1 rounded-full bg-clay-border/50 text-text-secondary">{parsed.area}</span>}
            {parsed.landmark && <span className="px-2 py-1 rounded-full bg-clay-border/50 text-text-secondary">near {parsed.landmark}</span>}
          </div>
        )}
      </div>

      <div>
        <span className={labelClass}>2. Drop the video or photos they sent</span>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
          onClick={() => fileInput.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.current?.click(); }}
          className={clsx('border-2 border-dashed rounded-clay-sm p-5 text-center cursor-pointer transition-all', dragging ? 'border-mustard bg-mustard-pale/40' : 'border-clay-border hover:border-mustard')}
        >
          <Upload01Icon className="w-7 h-7 text-text-tertiary mx-auto mb-1" />
          <p className="text-sm text-text-primary font-medium">Drop files here or tap to choose</p>
          <p className="text-xs text-text-tertiary">We'll pull the best photos out of the video for you</p>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/*"
            className="hidden"
            onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }}
          />
        </div>

        {photos.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {photos.map((f, i) => <Thumb key={`${f.name}-${i}`} file={f} onRemove={() => setPhotos((p) => p.filter((_, j) => j !== i))} />)}
          </div>
        )}

        {video && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Video01Icon className="w-4 h-4" /> {video.file.name}
                {video.loading && <><Loading02Icon className="w-3.5 h-3.5 animate-spin text-mustard" /> reading frames… {video.progress}%</>}
              </span>
              <button type="button" onClick={clearVideo} className="text-status-error font-semibold hover:underline">Remove video</button>
            </div>
            {video.error ? <ErrorLine message={video.error} /> : (
              <>
                <p className="text-xs text-text-secondary">
                  {video.frames.length} different shots found. Tap to choose the ones you want (up to {MAX_MEDIA}). The clearest are already ticked: {video.selected.length} selected.
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-[28rem] overflow-y-auto pr-1">
                  {video.frames.map((f) => {
                    const on = video.selected.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFrame(f.id)}
                        aria-pressed={on}
                        className={clsx('relative aspect-square rounded-clay-sm overflow-hidden border-2 transition-all', on ? 'border-mustard' : 'border-transparent opacity-60 hover:opacity-100')}
                      >
                        <img src={f.url} alt={`Frame at ${f.time.toFixed(1)}s`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/60 text-white text-[10px] font-medium">
                          {Math.floor(f.time / 60)}:{String(Math.floor(f.time % 60)).padStart(2, '0')}
                        </span>
                        {on && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-mustard flex items-center justify-center"><Tick02Icon className="w-3 h-3 text-white" /></span>}
                      </button>
                    );
                  })}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-text-secondary font-semibold">Need a specific moment? Pause the video and grab it</summary>
                  <div className="mt-2 space-y-2">
                    <video ref={previewRef} src={video.url} controls muted playsInline className="w-full max-h-72 rounded-clay-sm bg-black" />
                    <Button type="button" size="sm" variant="secondary" onClick={() => void grabCurrent()}>
                      <Camera01Icon className="w-4 h-4 mr-1.5" /> Grab this frame
                    </Button>
                  </div>
                </details>
              </>
            )}
              <div className="space-y-1 text-xs text-text-secondary">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={attachVideo && !video.shrinkError}
                    disabled={Boolean(video.shrinkError)}
                    onChange={(e) => setAttachVideo(e.target.checked)}
                  />
                  {video.shrinking
                    ? <span className="flex items-center gap-1.5"><Loading02Icon className="w-3.5 h-3.5 animate-spin text-mustard" /> Shrinking the video ({mb(video.file.size)}) to fit the 100MB limit… {video.shrinkProgress}%</span>
                    : video.uploadFile
                      ? `Also attach the video (${mb(video.uploadFile.size)}${video.uploadFile !== video.file ? `, shrunk from ${mb(video.file.size)}` : ''})`
                      : 'Also attach the video'}
                </label>
                {video.shrinkError && <p className="text-status-error">{video.shrinkError}</p>}
                {video.shrinking && <p>You can tick photos and fill the message while this runs. Untick to skip the video.</p>}
              </div>
          </div>
        )}
      </div>

      {problem && <ErrorLine message={problem} />}
      {overLimit && !problem && <p className="text-xs text-status-error">{allPhotos.length} photos picked; a listing holds {room}{videoToAttach ? ' plus the video' : ''}.</p>}

      <Button type="button" variant="primary" className="w-full" onClick={create} disabled={!text.trim() || Boolean(video?.loading) || waitingForVideo}>
        <FlashIcon className="w-4 h-4 mr-2" />
        {parsed && parsed.units.length > 1 ? `Make ${parsed.units.length} draft listings` : 'Make draft listing'}
        {allPhotos.length > 0 && ` · ${allPhotos.length} photo${allPhotos.length === 1 ? '' : 's'}`}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Draft card
// ---------------------------------------------------------------------------------------

function DraftCard({ card, onChange, onRemember, onRemove }: {
  card: QuickCard;
  onChange: (patch: Partial<QuickCard>) => void;
  onRemember: (field: RememberedField, value: string) => void;
  onRemove: () => void;
}) {
  const { form } = card;
  const locked = card.status === 'publishing' || card.status === 'published';
  const setField = <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => {
    const patch: Partial<QuickCard> = { form: { ...form, [field]: value } };
    if ((REMEMBERED_FIELDS as string[]).includes(field)) {
      patch.guessed = card.guessed.filter((g) => g !== field);
      onRemember(field as RememberedField, value as string);
    }
    onChange(patch);
  };
  const g = (f: RememberedField) => card.guessed.includes(f);
  const problem = cardProblem(card);
  const media = cardMedia(card);

  if (card.status === 'published') {
    return (
      <div className="clay-card p-4 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-status-success flex items-center justify-center"><Tick02Icon className="w-4 h-4 text-white" /></span>
        <div className="text-sm">
          <p className="font-semibold text-text-primary">{form.title}</p>
          <p className="text-text-secondary">Published. Waiting for admin approval.</p>
        </div>
      </div>
    );
  }

  return (
    <fieldset disabled={locked} className="clay-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <input value={form.title} onChange={(e) => setField('title', e.target.value)} aria-label="Title" className="clay-input flex-1 font-semibold" />
        <button type="button" onClick={onRemove} aria-label="Remove this draft" className="p-2 text-text-tertiary hover:text-status-error">
          <Delete02Icon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {card.photos.map((f, i) => (
          <Thumb
            key={`${f.name}-${i}`}
            file={f}
            isCover={i === 0}
            onRemove={() => onChange({ photos: card.photos.filter((_, j) => j !== i) })}
            onCover={() => onChange({ photos: [f, ...card.photos.filter((_, j) => j !== i)] })}
          />
        ))}
        {card.video && <Thumb file={card.video} onRemove={() => onChange({ video: null })} />}
        {media.length === 0 && <p className="text-xs text-text-tertiary py-6">No photos yet: at least {MIN_PHOTOS} are needed.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label>
          <span className={labelClass}>Type</span>
          <select value={form.propertyType} onChange={(e) => setField('propertyType', e.target.value as ListingFormData['propertyType'])} className="clay-input w-full">
            {propertyTypes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        {form.propertyType === 'shortlet' ? (
          <label>
            <span className={labelClass}>Price per night</span>
            <input
              type="number"
              value={form.shortletRates[0]?.price ?? ''}
              onChange={(e) => setField('shortletRates', [{ label: 'Per night', durationValue: '1', durationUnit: 'day', price: e.target.value }])}
              className="clay-input w-full"
            />
          </label>
        ) : (
          <label>
            <span className={labelClass}>Rent per year {form.annualRent && <span className="normal-case tracking-normal text-mustard">{naira(form.annualRent)}</span>}</span>
            <input type="number" value={form.annualRent} onChange={(e) => setField('annualRent', e.target.value)} className="clay-input w-full" placeholder="800000" />
          </label>
        )}
        <label>
          <span className={labelClass}>Area</span>
          <input value={form.area} onChange={(e) => setField('area', e.target.value)} className="clay-input w-full" placeholder="e.g. Toll Gate" />
        </label>
        <label>
          <span className={labelClass}>Near (landmark)</span>
          <input value={form.landmark} onChange={(e) => setField('landmark', e.target.value)} className="clay-input w-full" placeholder="e.g. Lead City University" />
        </label>
        <label>
          <span className={labelClass}>Address</span>
          <input value={form.address} onChange={(e) => setField('address', e.target.value)} className="clay-input w-full" />
        </label>
        <label>
          <FieldLabel guessed={g('city')}>City</FieldLabel>
          <input value={form.city} onChange={(e) => setField('city', e.target.value)} className="clay-input w-full" />
        </label>
      </div>

      <div className="space-y-3">
        <div><FieldLabel guessed={g('distanceFromSchool')}>Distance from school</FieldLabel><Chips options={distanceOptions} value={form.distanceFromSchool} onChange={(v) => setField('distanceFromSchool', v)} guessed={g('distanceFromSchool')} /></div>
        <div><FieldLabel guessed={g('furnishing')}>Furnishing</FieldLabel><Chips options={furnishingOptions} value={form.furnishing} onChange={(v) => setField('furnishing', v)} guessed={g('furnishing')} /></div>
        <div><FieldLabel guessed={g('power')}>Power</FieldLabel><Chips options={powerOptions} value={form.power} onChange={(v) => setField('power', v)} guessed={g('power')} /></div>
        <div><FieldLabel guessed={g('water')}>Water</FieldLabel><Chips options={waterOptions} value={form.water} onChange={(v) => setField('water', v)} guessed={g('water')} /></div>
        <div><FieldLabel guessed={g('gender')}>Who can rent</FieldLabel><Chips options={genderOptions} value={form.gender} onChange={(v) => setField('gender', v)} guessed={g('gender')} /></div>
      </div>

      <details>
        <summary className="cursor-pointer text-xs font-semibold text-text-secondary">Description, fees and amenities</summary>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={5} className="clay-input w-full resize-y text-sm" />
          </label>
          {form.propertyType !== 'shortlet' && (
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelClass}>Caution fee</span>
                <input type="number" value={form.cautionFee} onChange={(e) => setField('cautionFee', e.target.value)} className="clay-input w-full" />
              </label>
              <label>
                <span className={labelClass}>Agency fee</span>
                <input type="number" value={form.agencyFee} onChange={(e) => setField('agencyFee', e.target.value)} className="clay-input w-full" />
              </label>
              <label>
                <span className={labelClass}>Service charge (yearly)</span>
                <input type="number" value={form.serviceCharge} onChange={(e) => setField('serviceCharge', e.target.value)} className="clay-input w-full" />
              </label>
              <label>
                <span className={labelClass}>Inspection fee</span>
                <input type="number" value={form.inspectionFee} onChange={(e) => setField('inspectionFee', e.target.value)} className="clay-input w-full" />
              </label>
            </div>
          )}
          <div>
            <span className={labelClass}>Amenities</span>
            <div className="flex flex-wrap gap-1.5">
              {amenityOptions.map((o) => {
                const on = form.amenities.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setField('amenities', on ? form.amenities.filter((a) => a !== o.value) : [...form.amenities, o.value])}
                    aria-pressed={on}
                    className={clsx('px-3 py-1.5 rounded-full border text-xs font-medium', on ? 'border-mustard bg-mustard-pale text-mustard' : 'border-clay-border text-text-secondary hover:border-mustard')}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </details>

      {card.warnings.length > 0 && (
        <ul className="text-xs text-mustard space-y-1">
          {card.warnings.map((w) => <li key={w}>• {w}</li>)}
        </ul>
      )}
      {card.status === 'failed' && card.error && <ErrorLine message={card.error} />}
      {card.status === 'publishing' && (
        <p className="flex items-center gap-2 text-sm text-text-secondary"><Loading02Icon className="w-4 h-4 animate-spin text-mustard" /> Publishing…</p>
      )}
      {card.status !== 'publishing' && problem && <p className="text-xs text-status-error">Before publishing: {problem}</p>}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------------------

function useVerified(role: string, cached: boolean) {
  const [verified, setVerified] = useState<boolean | null>(cached ? true : null);
  useEffect(() => {
    void userApi.getKycStatus().then((res) => setVerified(res.success && res.data ? isVerifiedToList(res.data, role) : cached));
  }, []);
  return verified;
}

export function OwnerQuickAddPage({ role }: { role: OwnerRole }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || role;
  const verified = useVerified(userRole, user?.verificationStatus === 'verified');
  const api = useMemo(() => ownerApi(role), [role]);
  const dKey = defaultsKey(role, user?.id);
  const cKey = cardsKey(role, user?.id);

  const [defaults, setDefaults] = useState<QuickDefaults>(() => loadDefaults(dKey));
  const [cards, setCards] = useState<QuickCard[]>([]);
  const [restored, setRestored] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  // Bring back unpublished drafts (fields from localStorage, files from IndexedDB).
  useEffect(() => {
    let cancelled = false;
    const stored = loadStoredCards(cKey);
    void Promise.all(stored.map((c) => loadDraftPhotos(cardPhotosKey(role, user?.id, c.id)))).then((files) => {
      if (cancelled) return;
      const back = stored.map(({ hasVideo: _hasVideo, ...c }, i) => ({ ...c, ...splitMedia(files[i]) }));
      setCards((prev) => [...back.filter((b) => !prev.some((p) => p.id === b.id)), ...prev]);
      setRestored(true);
    });
    return () => { cancelled = true; };
  }, [cKey]);

  useEffect(() => {
    if (restored) saveStoredCards(cKey, cards);
  }, [cKey, cards, restored]);

  const storeFiles = (card: QuickCard) => void saveDraftPhotos(cardPhotosKey(role, user?.id, card.id), card.status === 'published' ? [] : cardMedia(card));

  const updateCard = (id: string, patch: Partial<QuickCard>) =>
    setCards((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch, ...(c.status === 'failed' && !patch.status ? { status: 'draft' as const, error: undefined } : {}) };
      if ('photos' in patch || 'video' in patch || patch.status === 'published') storeFiles(next);
      return next;
    }));

  const addCards = (created: QuickCard[]) => {
    created.forEach(storeFiles);
    setCards((prev) => [...created, ...prev]);
  };

  const removeCard = (id: string) => {
    void saveDraftPhotos(cardPhotosKey(role, user?.id, id), []);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const remember = (field: RememberedField, value: string) => {
    setDefaults((prev) => {
      const next = { ...prev, [field]: value } as QuickDefaults;
      saveDefaults(dKey, next);
      return next;
    });
  };

  const drafts = cards.filter((c) => c.status === 'draft' || c.status === 'failed');
  const ready = drafts.filter((c) => !cardProblem(c));
  const published = cards.filter((c) => c.status === 'published');

  const publishAll = async () => {
    setPublishing(true);
    try {
      for (const card of cardsRef.current.filter((c) => (c.status === 'draft' || c.status === 'failed') && !cardProblem(c))) {
        updateCard(card.id, { status: 'publishing', error: undefined });
        let listingId = card.listingId;
        if (!listingId) {
          const created = await api.createListing(buildListingPayload(card.form));
          if (!created.success) {
            updateCard(card.id, { status: 'failed', error: describeSubmitError(created.error) });
            continue;
          }
          listingId = created.data._id;
          updateCard(card.id, { listingId });
        }
        const uploaded = await api.uploadListingImages(listingId, cardMedia(card));
        if (!uploaded.success) {
          updateCard(card.id, { status: 'failed', listingId, error: `The listing was created, but the photos didn't upload (${uploaded.error.message}). Press Publish again to retry the photos only.` });
          continue;
        }
        updateCard(card.id, { status: 'published', listingId });
      }
    } finally {
      setPublishing(false);
    }
  };

  if (verified === null) {
    return (
      <AppLayout role={role} title="Quick Add">
        <div className="flex items-center justify-center h-64"><Loading02Icon className="w-8 h-8 animate-spin text-mustard" /></div>
      </AppLayout>
    );
  }

  if (!verified) {
    return (
      <AppLayout role={role} title="Quick Add">
        <div className="max-w-lg mx-auto py-12 px-4 clay-card p-6 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Verify your identity first</h2>
          <p className="text-text-secondary mb-4">Listings can only be published once your identity is verified.</p>
          <Link to={`/${role}/create-listing`} className="text-mustard font-semibold hover:underline">Verify now</Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role={role} title="Quick Add" subtitle="Paste the agent's message, drop the video, publish">
      <div className="max-w-3xl mx-auto pb-6 space-y-5">
        <Composer defaults={defaults} onCreate={addCards} />

        {drafts.length > 0 && (
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Drafts ({drafts.length}){ready.length < drafts.length && ` · ${drafts.length - ready.length} need a look`}
          </h2>
        )}
        {cards.map((card) => (
          <DraftCard
            key={card.id}
            card={card}
            onChange={(patch) => updateCard(card.id, patch)}
            onRemember={remember}
            onRemove={() => removeCard(card.id)}
          />
        ))}
        {(drafts.length > 0 || published.length > 0) && (
          <div className="sticky bottom-3 z-30 clay-card bg-clay-surface/95 backdrop-blur px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                {published.length > 0 && <span className="text-status-success font-semibold">{published.length} published. </span>}
                {drafts.length > 0 ? `${ready.length} of ${drafts.length} ready` : 'All done.'}
              </p>
              <div className="flex gap-2">
                {published.length > 0 && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/${role}/listings`)}>My Listings</Button>
                )}
                {drafts.length > 0 && (
                  <Button type="button" variant="primary" size="sm" loading={publishing} disabled={ready.length === 0} onClick={() => void publishAll()}>
                    Publish {ready.length} listing{ready.length === 1 ? '' : 's'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </AppLayout>
  );
}
