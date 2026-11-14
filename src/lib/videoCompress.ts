/**
 * Shrinks a listing video in the browser so it fits the 100MB per-file limit of our Cloudinary
 * plan (and the backend's matching cap). Uses the browser's own video encoder through WebCodecs
 * (via mediabunny), which is hardware accelerated on most machines and runs faster than playing
 * the video through. The output is always a standard H.264/AAC MP4, the format the backend's
 * upload check and every app's player expect.
 *
 * The bitrate is worked out from the video's length so the file lands near TARGET_BYTES; the
 * resolution drops only when a long video would otherwise look blocky at that bitrate.
 */
// mediabunny is loaded only when a video actually needs shrinking (see `compressVideo`), so it
// stays out of the bundle every visitor downloads.
import type { Quality } from 'mediabunny';

type Mediabunny = typeof import('mediabunny');

/** The backend and Cloudinary refuse anything over 100MB; aim a little under for safety. */
export const UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;
export const TARGET_BYTES = 90 * 1024 * 1024;
/** Files at or under this size, already MP4/MOV, upload as they are. */
export const SEND_AS_IS_BYTES = 95 * 1024 * 1024;
const AUDIO_BPS = 96_000;
/** More than this buys nothing visible for a phone walkthrough at 720p. */
const MAX_VIDEO_BPS = 2_500_000;
/** Below this even 360p turns to mush; such a video is too long to attach. */
const MIN_VIDEO_BPS = 300_000;
/** Container overhead and encoder overshoot. */
const SAFETY = 0.92;

export interface CompressionPlan {
  videoBitrate: number;
  /** Target size of the SHORT side (720 for a 1280x720 or a 720x1280 video). */
  shortSide: number;
  width: number;
  height: number;
  estimatedBytes: number;
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/**
 * The bitrate and size to encode at, or null when the video is too long to fit the limit at a
 * watchable quality. Pure, exported for tests.
 */
export function planCompression(durationSeconds: number, width: number, height: number): CompressionPlan | null {
  if (!(durationSeconds > 0) || !(width > 0) || !(height > 0)) return null;
  const budget = ((TARGET_BYTES * 8) / durationSeconds) * SAFETY - AUDIO_BPS;
  const videoBitrate = Math.floor(Math.min(MAX_VIDEO_BPS, budget));
  if (videoBitrate < MIN_VIDEO_BPS) return null;
  const wanted = videoBitrate >= 1_400_000 ? 720 : videoBitrate >= 800_000 ? 540 : 360;
  const short = Math.min(width, height);
  const scale = Math.min(1, wanted / short);
  const w = even(width * scale);
  const h = even(height * scale);
  return {
    videoBitrate,
    shortSide: Math.min(w, h),
    width: w,
    height: h,
    estimatedBytes: Math.round(((videoBitrate + AUDIO_BPS) * durationSeconds) / 8),
  };
}

/** Whether this file can go up without shrinking. */
export function canSendAsIs(file: Pick<File, 'size' | 'type'>): boolean {
  return file.size <= SEND_AS_IS_BYTES && (file.type === 'video/mp4' || file.type === 'video/quicktime');
}

export function browserCanCompress(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;
}

export class VideoTooLongError extends Error {}

/**
 * Re-encodes `file` to an MP4 under the upload limit. `onProgress` gets 0..1. Throws
 * VideoTooLongError when it cannot fit, or a plain Error when the browser cannot do it.
 */
export async function compressVideo(
  file: File,
  { onProgress, signal }: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<File> {
  if (!browserCanCompress()) throw new Error("This browser can't shrink videos. Use Chrome or Edge on a computer, or only the photos will be used.");
  const mb = await import('mediabunny');
  const { Input, BlobSource, ALL_FORMATS, Quality, canEncodeVideo } = mb;
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error('No video found in this file.');
    const duration = await input.computeDuration();
    const plan = planCompression(duration, track.displayWidth, track.displayHeight);
    if (!plan) {
      throw new VideoTooLongError(
        `This video is ${Math.round(duration / 60)} minutes long, too long to fit 100MB at a watchable quality. The photos from it will still be used.`
      );
    }
    // An explicit bitrate: a bare number would be read as a 0-1 quality level, not bits per second.
    const quality = new Quality({ bitrate: plan.videoBitrate, bitrateMode: 'constant' });
    if (!(await canEncodeVideo('avc', { width: plan.width, height: plan.height, bitrate: quality }))) {
      throw new Error("This browser can't encode MP4 video. Use Chrome or Edge on a computer, or only the photos will be used.");
    }

    // The hardware encoder occasionally fails mid-run ("Encoding error"), seen when the GPU is
    // busy decoding the same video for the frame grid. Retry once on the software encoder.
    let buffer: ArrayBuffer | null = null;
    for (const hardwareAcceleration of ['no-preference', 'prefer-software'] as const) {
      if (signal?.aborted) throw new Error('Canceled.');
      try {
        buffer = await convertOnce(mb, file, plan, quality, hardwareAcceleration, onProgress, signal);
        break;
      } catch (e) {
        if (signal?.aborted || hardwareAcceleration === 'prefer-software' || e instanceof VideoTooLongError) throw e;
        onProgress?.(0);
      }
    }
    if (!buffer) throw new Error('The video could not be converted.');
    if (buffer.byteLength > UPLOAD_LIMIT_BYTES) {
      throw new VideoTooLongError('Even after shrinking, this video is over 100MB. The photos from it will still be used.');
    }
    const name = (file.name.replace(/\.[^.]+$/, '') || 'video') + '.mp4';
    return new File([buffer], name, { type: 'video/mp4' });
  } finally {
    input.dispose();
  }
}

async function convertOnce(
  mb: Mediabunny,
  file: File,
  plan: CompressionPlan,
  quality: Quality,
  hardwareAcceleration: 'no-preference' | 'prefer-software',
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  const { Input, BlobSource, ALL_FORMATS, Output, Mp4OutputFormat, BufferTarget, Conversion, Quality } = mb;
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: { codec: 'avc', width: plan.width, height: plan.height, fit: 'contain', quality, forceTranscode: true, hardwareAcceleration },
      audio: { codec: 'aac', quality: new Quality({ bitrate: AUDIO_BPS }), numberOfChannels: 2 },
    });
    if (!conversion.isValid) throw new Error("This video's format can't be converted in the browser. Only the photos will be used.");
    conversion.onProgress = (p) => onProgress?.(Math.min(1, Math.max(0, p)));
    const abort = () => void conversion.cancel();
    signal?.addEventListener('abort', abort);
    try {
      await conversion.execute();
    } finally {
      signal?.removeEventListener('abort', abort);
    }
    const buffer = (output.target as InstanceType<Mediabunny['BufferTarget']>).buffer;
    if (!buffer) throw new Error('The video could not be converted.');
    return buffer;
  } finally {
    input.dispose();
  }
}
