import { describe, it, expect } from 'vitest';
import { recolorPixels } from '../recolor';

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba);

describe('recolorPixels', () => {
  const ink = { r: 200, g: 40, b: 10 };
  it('turns black into the ink color, fully opaque', () => {
    const d = px(0, 0, 0, 255);
    recolorPixels(d, ink);
    expect([...d]).toEqual([200, 40, 10, 255]);
  });
  it('turns white into transparent', () => {
    const d = px(255, 255, 255, 255);
    recolorPixels(d, ink);
    expect(d[3]).toBe(0);
  });
  it('keeps anti-aliased edges as partial alpha', () => {
    const d = px(128, 128, 128, 255);
    recolorPixels(d, ink);
    expect(d[3]).toBeGreaterThan(100);
    expect(d[3]).toBeLessThan(155);
    expect([d[0], d[1], d[2]]).toEqual([200, 40, 10]);
  });
  it('treats near-white paper noise as fully transparent', () => {
    const d = px(250, 251, 249, 255);
    recolorPixels(d, ink);
    expect(d[3]).toBe(0);
  });
});
