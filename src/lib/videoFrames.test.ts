import { describe, it, expect } from 'vitest';
import { pickBestFrames, scoreGrey, frameCountFor, frameDistance, signatureOf, SAME_SHOT } from './videoFrames';

const frame = (id: string, time: number, sharpness: number, brightness = 120) => ({ id, time, sharpness, brightness });

describe('pickBestFrames', () => {
  it('takes the sharpest frame from each stretch of the video, in time order', () => {
    const frames = [frame('a', 0, 5), frame('b', 1, 50), frame('c', 2, 10), frame('d', 3, 80), frame('e', 4, 30), frame('f', 5, 20)];
    expect(pickBestFrames(frames, 3)).toEqual(['b', 'd', 'e']);
  });

  it('skips black and blown-out frames', () => {
    const frames = [frame('dark', 0, 999, 10), frame('ok1', 1, 5), frame('ok2', 2, 5), frame('white', 3, 999, 250)];
    expect(pickBestFrames(frames, 2)).toEqual(['ok1', 'ok2']);
  });

  it('returns everything when there are fewer frames than wanted', () => {
    expect(pickBestFrames([frame('b', 1, 1), frame('a', 0, 1)], 6)).toEqual(['a', 'b']);
  });
});

describe('scoreGrey', () => {
  it('scores a sharp checkerboard far above a flat grey', () => {
    const w = 8;
    const h = 8;
    const flat = new Float32Array(w * h).fill(128);
    const checker = new Float32Array(w * h).map((_, i) => (((i % w) + Math.floor(i / w)) % 2 ? 255 : 0));
    expect(scoreGrey(flat, w, h).sharpness).toBe(0);
    expect(scoreGrey(checker, w, h).sharpness).toBeGreaterThan(1000);
    expect(scoreGrey(flat, w, h).brightness).toBe(128);
  });
});

describe('frameCountFor', () => {
  it('offers more frames for longer videos, within limits', () => {
    expect(frameCountFor(10)).toBe(14);
    expect(frameCountFor(120)).toBe(30);
    expect(frameCountFor(300)).toBe(72);
    expect(frameCountFor(1800)).toBe(72);
  });
});

describe('near-duplicate detection', () => {
  const sig = (fill: (x: number, y: number) => number) => {
    const g = new Float32Array(16 * 16).map((_, i) => fill(i % 16, Math.floor(i / 16)));
    return signatureOf(g, 16, 16);
  };
  it('treats the same shot with a little noise as the same, and a different shot as different', () => {
    const room = sig((x) => x * 10);
    const roomAgain = sig((x, y) => x * 10 + ((x + y) % 2));
    const kitchen = sig((_, y) => 255 - y * 12);
    expect(frameDistance(room, roomAgain)).toBeLessThan(SAME_SHOT);
    expect(frameDistance(room, kitchen)).toBeGreaterThan(SAME_SHOT);
  });

  it('does not pick two frames of the same shot when a different one is available', () => {
    const a = sig((x) => x * 10);
    const b = sig((_, y) => y * 14);
    const frames = [
      { id: 'room-sharp', time: 0, sharpness: 90, brightness: 120, signature: a },
      { id: 'room-again', time: 1, sharpness: 80, brightness: 120, signature: a },
      { id: 'other', time: 2, sharpness: 10, brightness: 120, signature: b },
      { id: 'room-third', time: 3, sharpness: 70, brightness: 120, signature: a },
    ];
    expect(pickBestFrames(frames, 2)).toEqual(['room-sharp', 'other']);
  });
});
