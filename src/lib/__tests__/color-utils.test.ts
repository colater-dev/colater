import { describe, it, expect } from 'vitest';
import {
  hslToRgb,
  rgbToHsl,
  hexToRgb,
  rgbToHex,
  shiftHue,
  darkenColor,
  lightenColor,
  isLightColor,
} from '../color-utils';

describe('hexToRgb', () => {
  it('parses a standard hex color', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses without the # prefix', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('is case-insensitive', () => {
    expect(hexToRgb('#FF8800')).toEqual(hexToRgb('#ff8800'));
  });

  it('returns null for invalid hex strings', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
    expect(hexToRgb('#xyz')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });

  it('returns null for shorthand hex (3-digit)', () => {
    // The regex only matches 6-digit hex
    expect(hexToRgb('#fff')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('converts red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('converts green', () => {
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
  });

  it('converts blue', () => {
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
  });

  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('pads single-digit hex values', () => {
    expect(rgbToHex(1, 2, 3)).toBe('#010203');
  });
});

describe('hexToRgb and rgbToHex roundtrip', () => {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#123456', '#abcdef', '#000000', '#ffffff'];

  for (const hex of colors) {
    it(`roundtrips ${hex}`, () => {
      const rgb = hexToRgb(hex)!;
      expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe(hex);
    });
  }
});

describe('hslToRgb', () => {
  it('converts pure red (h=0, s=1, l=0.5)', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual([255, 0, 0]);
  });

  it('converts pure green (h=1/3, s=1, l=0.5)', () => {
    expect(hslToRgb(1 / 3, 1, 0.5)).toEqual([0, 255, 0]);
  });

  it('converts pure blue (h=2/3, s=1, l=0.5)', () => {
    expect(hslToRgb(2 / 3, 1, 0.5)).toEqual([0, 0, 255]);
  });

  it('converts white (l=1)', () => {
    expect(hslToRgb(0, 0, 1)).toEqual([255, 255, 255]);
  });

  it('converts black (l=0)', () => {
    expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it('converts achromatic gray (s=0)', () => {
    const [r, g, b] = hslToRgb(0.5, 0, 0.5);
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(r).toBe(128);
  });
});

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 5);
    expect(s).toBeCloseTo(1, 5);
    expect(l).toBeCloseTo(0.5, 5);
  });

  it('converts white', () => {
    const [, s, l] = rgbToHsl(255, 255, 255);
    expect(s).toBe(0);
    expect(l).toBe(1);
  });

  it('converts black', () => {
    const [, s, l] = rgbToHsl(0, 0, 0);
    expect(s).toBe(0);
    expect(l).toBe(0);
  });

  it('converts mid-gray', () => {
    const [, s, l] = rgbToHsl(128, 128, 128);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(128 / 255, 2);
  });
});

describe('hslToRgb and rgbToHsl roundtrip', () => {
  const testColors: [number, number, number][] = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [128, 64, 32],
  ];

  for (const [r, g, b] of testColors) {
    it(`roundtrips rgb(${r}, ${g}, ${b})`, () => {
      const [h, s, l] = rgbToHsl(r, g, b);
      const [r2, g2, b2] = hslToRgb(h, s, l);
      expect(r2).toBeCloseTo(r, 0);
      expect(g2).toBeCloseTo(g, 0);
      expect(b2).toBeCloseTo(b, 0);
    });
  }
});

describe('shiftHue', () => {
  it('returns same color for 0 degree shift', () => {
    expect(shiftHue('#ff0000', 0)).toBe('#ff0000');
  });

  it('returns same color for 360 degree shift', () => {
    expect(shiftHue('#ff0000', 360)).toBe('#ff0000');
  });

  it('shifts red by 120 degrees to green', () => {
    const result = hexToRgb(shiftHue('#ff0000', 120))!;
    expect(result.r).toBe(0);
    expect(result.g).toBe(255);
    expect(result.b).toBe(0);
  });

  it('shifts red by 240 degrees to blue', () => {
    const result = hexToRgb(shiftHue('#ff0000', 240))!;
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(255);
  });

  it('handles negative shifts', () => {
    // -120 from red should be blue
    const result = hexToRgb(shiftHue('#ff0000', -120))!;
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(255);
  });

  it('returns original hex for invalid input', () => {
    expect(shiftHue('invalid', 90)).toBe('invalid');
  });

  it('does not change achromatic colors', () => {
    expect(shiftHue('#808080', 180)).toBe('#808080');
  });
});

describe('darkenColor', () => {
  it('makes a color darker', () => {
    const original = hexToRgb('#8080ff')!;
    const darkened = hexToRgb(darkenColor('#8080ff', 0.2))!;
    const originalLuminance = 0.299 * original.r + 0.587 * original.g + 0.114 * original.b;
    const darkenedLuminance = 0.299 * darkened.r + 0.587 * darkened.g + 0.114 * darkened.b;
    expect(darkenedLuminance).toBeLessThan(originalLuminance);
  });

  it('does not go below black', () => {
    const result = hexToRgb(darkenColor('#000000', 0.5))!;
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it('returns original hex for invalid input', () => {
    expect(darkenColor('invalid', 0.2)).toBe('invalid');
  });

  it('uses default amount of 0.2', () => {
    expect(darkenColor('#ffffff')).toBe(darkenColor('#ffffff', 0.2));
  });
});

describe('lightenColor', () => {
  it('makes a color lighter', () => {
    const original = hexToRgb('#804020')!;
    const lightened = hexToRgb(lightenColor('#804020', 0.2))!;
    const originalLuminance = 0.299 * original.r + 0.587 * original.g + 0.114 * original.b;
    const lightenedLuminance = 0.299 * lightened.r + 0.587 * lightened.g + 0.114 * lightened.b;
    expect(lightenedLuminance).toBeGreaterThan(originalLuminance);
  });

  it('does not go above white', () => {
    const result = hexToRgb(lightenColor('#ffffff', 0.5))!;
    expect(result.r).toBe(255);
    expect(result.g).toBe(255);
    expect(result.b).toBe(255);
  });

  it('returns original hex for invalid input', () => {
    expect(lightenColor('invalid', 0.2)).toBe('invalid');
  });
});

describe('isLightColor', () => {
  it('considers white as light', () => {
    expect(isLightColor('#ffffff')).toBe(true);
  });

  it('considers black as dark', () => {
    expect(isLightColor('#000000')).toBe(false);
  });

  it('considers pure red as dark', () => {
    expect(isLightColor('#ff0000')).toBe(false);
  });

  it('considers yellow as dark (threshold is 0.75)', () => {
    // Yellow has high luminance (~0.886) so should be light
    expect(isLightColor('#ffff00')).toBe(true);
  });

  it('considers mid-gray as dark', () => {
    expect(isLightColor('#808080')).toBe(false);
  });

  it('defaults to light for invalid input', () => {
    expect(isLightColor('invalid')).toBe(true);
  });

  it('considers light gray (#e0e0e0) as light', () => {
    // luminance = 0.878, above 0.75 threshold
    expect(isLightColor('#e0e0e0')).toBe(true);
  });
});
