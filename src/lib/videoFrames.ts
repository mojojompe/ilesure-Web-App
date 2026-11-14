/**
 * Pulls still photos out of a walkthrough video in the browser, so a lister no longer pauses
 * and screenshots the video an agent sent. The video never leaves the device for this: it is
 * played into a <video>, seeked to evenly spaced moments, and each moment is drawn to a canvas
 * and saved as a JPEG. Each frame is scored for sharpness (motion blur is the usual problem
 * with phone walkthroughs) and brightness, and `pickBestFrames` preselects the clearest frame
 * from each stretch of the video.
 */

export interface VideoFrame {
  id: string;
  /** Seconds into the video. */
  time: number;
  file: File;
  /** Object URL for showing the frame; revoke with `releaseFrames`. */
  url: string;
  /** Higher is sharper (variance of the Laplacian on a small grey copy). */
  sharpness: number;
  /** Mean luminance, 0-255. */
  brightness: number;
  /** 8x8 grey thumbnail, for spotting near-identical frames (see `frameDistance`). */
  signature: number[];
}

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.88;
const SCORE_WIDTH = 160;

let frameSeq = 0;

function waitFor(video: HTMLVideoElement, event: 'loadeddata' | 'seeked', timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => done(new Error('timeout')), timeoutMs);
    const onEvent = () => done();
    const onError = () => done(new Error('error'));
    function done(err?: Error) {
      window.clearTimeout(timer);
      video.removeEventListener(event, onEvent);
      video.removeEventListener('error', onError);
      if (err) reject(err);
      else resolve();
    }
    video.addEventListener(event, onEvent);
    video.addEventListener('error', onError);
  });
}

/** Opens a video file for frame grabbing. Call `close` when finished. */
export async function openVideo(file: File): Promise<{ video: HTMLVideoElement; duration: number; close: () => void }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  const close = () => {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  };
  try {
    await waitFor(video, 'loadeddata', 15000);
  } catch {
    close();
    throw new Error("This video can't be opened in the browser. Try the original MP4 from WhatsApp, or add screenshots instead.");
  }
  // Browser-recorded WebM files often report an Infinite duration until played through. Seeking
  // far past the end makes the browser work out the real length.
  if (!Number.isFinite(video.duration)) {
    try {
      video.currentTime = 1e7;
      await waitFor(video, 'seeked', 15000);
      video.currentTime = 0;
      await waitFor(video, 'seeked', 15000);
    } catch {
      // Fall through: the check below reports the video as unreadable.
    }
  }
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (!duration || !video.videoWidth) {
    close();
    throw new Error("This video seems to be empty or can't be read.");
  }
  return { video, duration, close };
}

/** Scores a frame: Laplacian variance (sharpness) and mean luminance. Exported for tests. */
export function scoreGrey(grey: Float32Array, width: number, height: number): { sharpness: number; brightness: number } {
  let sum = 0;
  for (let i = 0; i < grey.length; i++) sum += grey[i];
  const brightness = grey.length ? sum / grey.length : 0;
  let n = 0;
  let mean = 0;
  let m2 = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = grey[i - width] + grey[i + width] + grey[i - 1] + grey[i + 1] - 4 * grey[i];
      n += 1;
      const delta = lap - mean;
      mean += delta / n;
      m2 += delta * (lap - mean);
    }
  }
  return { sharpness: n > 1 ? m2 / (n - 1) : 0, brightness };
}

function scoreCanvas(source: HTMLCanvasElement): { sharpness: number; brightness: number; signature: number[] } {
  const width = SCORE_WIDTH;
  const height = Math.max(2, Math.round((source.height / source.width) * width));
  const small = document.createElement('canvas');
  small.width = width;
  small.height = height;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { sharpness: 0, brightness: 128, signature: [] };
  ctx.drawImage(source, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const grey = new Float32Array(width * height);
  for (let i = 0, p = 0; i < grey.length; i++, p += 4) grey[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  return { ...scoreGrey(grey, width, height), signature: signatureOf(grey, width, height) };
}

const SIG = 8;

/** Box-averages a grey image down to SIG x SIG. Exported for tests. */
export function signatureOf(grey: Float32Array, width: number, height: number): number[] {
  const sig: number[] = [];
  for (let by = 0; by < SIG; by++) {
    for (let bx = 0; bx < SIG; bx++) {
      const x0 = Math.floor((bx * width) / SIG), x1 = Math.max(x0 + 1, Math.floor(((bx + 1) * width) / SIG));
      const y0 = Math.floor((by * height) / SIG), y1 = Math.max(y0 + 1, Math.floor(((by + 1) * height) / SIG));
      let sum = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += grey[y * width + x];
      sig.push(sum / ((x1 - x0) * (y1 - y0)));
    }
  }
  return sig;
}

/** Mean absolute difference of two signatures, 0-255. Under ~8 the frames look the same. */
export function frameDistance(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 255;
  let d = 0;
  for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]);
  return d / a.length;
}

/** Frames closer than this are treated as the same shot. */
export const SAME_SHOT = 8;

/**
 * How many frames to offer for a video: about one every 4 seconds, at least 14 (short clips)
 * and at most 72 (a 5-minute walkthrough gives one roughly every 4-5 seconds).
 */
export function frameCountFor(durationSeconds: number): number {
  return Math.max(14, Math.min(72, Math.round(durationSeconds / 4)));
}

/** Grabs the frame at `time` seconds from an opened video. */
export async function grabFrame(video: HTMLVideoElement, time: number, name = 'frame'): Promise<VideoFrame> {
  if (Math.abs(video.currentTime - time) > 0.01) {
    video.currentTime = time;
    await waitFor(video, 'seeked');
  }
  const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error('Could not save the frame.');
  const id = `f${++frameSeq}`;
  const file = new File([blob], `${name}-${Math.round(time * 10)}.jpg`, { type: 'image/jpeg' });
  return { id, time, file, url: URL.createObjectURL(blob), ...scoreCanvas(canvas) };
}

/**
 * Grabs frames evenly across the video (`frameCountFor` its length unless `count` is given),
 * skipping the first and last moments (usually the phone being raised or lowered) and any frame
 * that looks the same as the one kept before it (the agent standing still). `onUpdate` gets the
 * frames kept so far and the progress after every attempt, so the grid fills in live.
 */
export async function extractFrames(
  file: File,
  { count, onUpdate }: {
    count?: number;
    onUpdate?: (frames: VideoFrame[], done: number, total: number) => void;
  } = {}
): Promise<VideoFrame[]> {
  const { video, duration, close } = await openVideo(file);
  count ??= frameCountFor(duration);
  const base = file.name.replace(/\.[^.]+$/, '') || 'frame';
  const frames: VideoFrame[] = [];
  try {
    const start = Math.min(0.5, duration * 0.05);
    const end = Math.max(start, duration - Math.min(0.5, duration * 0.05));
    const step = count > 1 ? (end - start) / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      try {
        const frame = await grabFrame(video, start + step * i, base);
        const last = frames[frames.length - 1];
        if (last && frameDistance(last.signature, frame.signature) < SAME_SHOT) {
          // Same shot as the previous frame: keep whichever is sharper.
          if (frame.sharpness > last.sharpness) {
            URL.revokeObjectURL(last.url);
            frames[frames.length - 1] = frame;
          } else {
            URL.revokeObjectURL(frame.url);
          }
        } else {
          frames.push(frame);
        }
      } catch {
        // A frame that will not decode is skipped; the rest still come through.
      }
      onUpdate?.([...frames], i + 1, count);
    }
  } finally {
    close();
  }
  if (!frames.length) throw new Error("Couldn't read any frames from this video.");
  return frames;
}

type Scored = Pick<VideoFrame, 'id' | 'time' | 'sharpness' | 'brightness'> & { signature?: number[] };

/**
 * The clearest frame from each of `want` equal stretches of the video, skipping frames that
 * are nearly black or blown out, and preferring a frame that does not look like one already
 * picked. Returns frame ids in time order.
 */
export function pickBestFrames(frames: Scored[], want = 6): string[] {
  const usable = frames.filter((f) => f.brightness > 35 && f.brightness < 235);
  const pool = usable.length >= Math.min(want, frames.length) ? usable : frames;
  if (pool.length <= want) return [...pool].sort((a, b) => a.time - b.time).map((f) => f.id);
  const sorted = [...pool].sort((a, b) => a.time - b.time);
  const picked: Scored[] = [];
  const looksPicked = (f: Scored) =>
    picked.some((p) => p.signature && f.signature && frameDistance(p.signature, f.signature) < SAME_SHOT);
  for (let g = 0; g < want; g++) {
    const group = sorted.slice(Math.floor((g * sorted.length) / want), Math.floor(((g + 1) * sorted.length) / want));
    if (!group.length) continue;
    const bySharpness = [...group].sort((a, b) => b.sharpness - a.sharpness);
    picked.push(bySharpness.find((f) => !looksPicked(f)) ?? bySharpness[0]);
  }
  return picked.map((f) => f.id);
}

export function releaseFrames(frames: Pick<VideoFrame, 'url'>[]): void {
  for (const f of frames) URL.revokeObjectURL(f.url);
}
