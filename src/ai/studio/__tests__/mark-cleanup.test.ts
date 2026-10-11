import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { levels, removeFrame, cleanMark } from '../mark-cleanup';

describe('levels', () => {
  it('pushes dark grey to black and near-white to white, keeping edge tones in between', () => {
    expect(levels(51)).toBe(0);
    expect(levels(0)).toBe(0);
    expect(levels(240)).toBe(255);
    const mid = levels(130);
    expect(mid).toBeGreaterThan(60);
    expect(mid).toBeLessThan(200);
  });
});

describe('removeFrame', () => {
  const W = 50, H = 50;
  const canvas = () => new Uint8Array(W * H).fill(255);
  const rect = (d: Uint8Array, x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) d[y * W + x] = 0;
  };
  it('whitens a thin frame running around all four edges', () => {
    const d = canvas();
    rect(d, 0, 0, W - 1, 0); rect(d, 0, H - 1, W - 1, H - 1); rect(d, 0, 0, 0, H - 1); rect(d, W - 1, 0, W - 1, H - 1);
    rect(d, 20, 20, 29, 29); // the mark
    removeFrame(d, W, H);
    expect(d[0]).toBe(255);
    expect(d[(H - 1) * W + 10]).toBe(255);
    expect(d[25 * W + 25]).toBe(0);
  });
  it('leaves a mark that merely touches one edge alone', () => {
    const d = canvas();
    rect(d, 0, 10, W - 1, 15); // a wide bar touching left and right only
    removeFrame(d, W, H);
    expect(d[12 * W]).toBe(0);
  });
});

describe('cleanMark', () => {
  it('returns a PNG whose dark grey mark is pure black on white', async () => {
    const grey = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#ffffff' } })
      .composite([{ input: { create: { width: 20, height: 20, channels: 3, background: '#333333' } }, left: 10, top: 10 }])
      .png().toBuffer();
    const out = await cleanMark(grey);
    expect(out.contentType).toBe('image/png');
    const { data, info } = await sharp(out.buffer).greyscale().raw().toBuffer({ resolveWithObject: true });
    expect(data[20 * info.width + 20]).toBe(0);
    expect(data[2 * info.width + 2]).toBe(255);
  });
});
