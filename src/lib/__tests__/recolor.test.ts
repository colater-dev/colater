import { describe, it, expect } from 'vitest';
import { recolorPixels, measureInk } from '../recolor';

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

describe('measureInk', () => {
  // 4x3 image, transparent except a 2x1 opaque block at (1,1) plus one faint pixel ignored as paper noise.
  const img = () => {
    const d = new Uint8ClampedArray(4 * 3 * 4);
    const set = (x: number, y: number, a: number) => { d[(y * 4 + x) * 4 + 3] = a; };
    set(1, 1, 255); set(2, 1, 255); set(3, 2, 10);
    return d;
  };
  it('finds the bounding box of the ink and how much of it is filled', () => {
    expect(measureInk(img(), 4, 3)).toEqual({ x: 1, y: 1, width: 2, height: 1, density: 1 });
  });
  it('is null for an empty image', () => {
    expect(measureInk(new Uint8ClampedArray(16), 2, 2)).toBeNull();
  });
  it('density is ink pixels over the box area', () => {
    const d = new Uint8ClampedArray(2 * 2 * 4);
    d[3] = 255; d[15] = 255; // diagonal corners
    expect(measureInk(d, 2, 2)?.density).toBe(0.5);
  });
});
