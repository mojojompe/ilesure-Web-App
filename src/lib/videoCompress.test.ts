import { describe, it, expect } from 'vitest';
import { planCompression, canSendAsIs, TARGET_BYTES, UPLOAD_LIMIT_BYTES } from './videoCompress';

const MB = 1024 * 1024;

describe('planCompression', () => {
  it('keeps a 5-minute phone video at 720p and under the limit', () => {
    const plan = planCompression(300, 1080, 1920)!;
    expect(plan.shortSide).toBe(720);
    expect(plan.width).toBe(720);
    expect(plan.height).toBe(1280);
    expect(plan.estimatedBytes).toBeLessThanOrEqual(TARGET_BYTES);
  });

  it('caps the bitrate for short videos instead of inflating them', () => {
    const plan = planCompression(30, 1920, 1080)!;
    expect(plan.videoBitrate).toBe(2_500_000);
    expect(plan.estimatedBytes).toBeLessThan(15 * MB);
  });

  it('lowers the resolution for long videos', () => {
    expect(planCompression(12 * 60, 1920, 1080)!.shortSide).toBe(540);
    expect(planCompression(25 * 60, 1920, 1080)!.shortSide).toBe(360);
  });

  it('never upscales a small video', () => {
    expect(planCompression(60, 640, 360)!.shortSide).toBe(360);
  });

  it('gives up on a video too long to fit at a watchable quality', () => {
    expect(planCompression(60 * 60, 1920, 1080)).toBeNull();
  });

  it('every plan fits the upload limit', () => {
    for (const minutes of [0.5, 1, 3, 5, 10, 20, 30]) {
      const plan = planCompression(minutes * 60, 1920, 1080);
      if (plan) expect(plan.estimatedBytes).toBeLessThan(UPLOAD_LIMIT_BYTES);
    }
  });
});

describe('canSendAsIs', () => {
  it('sends small MP4/MOV files unchanged and shrinks everything else', () => {
    expect(canSendAsIs({ size: 40 * MB, type: 'video/mp4' })).toBe(true);
    expect(canSendAsIs({ size: 40 * MB, type: 'video/quicktime' })).toBe(true);
    expect(canSendAsIs({ size: 300 * MB, type: 'video/mp4' })).toBe(false);
    expect(canSendAsIs({ size: 5 * MB, type: 'video/webm' })).toBe(false);
  });
});
