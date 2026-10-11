import { describe, it, expect } from 'vitest';
import { MOTION_PRESETS, pickMotionPreset, nextMotionPreset } from '../motion-presets';

describe('MOTION_PRESETS', () => {
  it('has a good handful of distinct, labelled presets', () => {
    expect(MOTION_PRESETS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(MOTION_PRESETS.map(p => p.id)).size).toBe(MOTION_PRESETS.length);
    for (const p of MOTION_PRESETS) expect(p.label).toMatch(/\S/);
  });
  it('every preset finishes within a short loop', () => {
    for (const p of MOTION_PRESETS) expect(p.durationMs).toBeLessThanOrEqual(2500);
  });
});

describe('pickMotionPreset', () => {
  it('is stable for the same direction', () => {
    expect(pickMotionPreset('dirA').id).toBe(pickMotionPreset('dirA').id);
  });
  it('spreads directions across presets', () => {
    const ids = new Set(Array.from({ length: 40 }, (_, i) => pickMotionPreset(`direction-${i}`).id));
    expect(ids.size).toBeGreaterThanOrEqual(4);
  });
});

describe('nextMotionPreset', () => {
  it('always picks a different preset', () => {
    for (const p of MOTION_PRESETS) {
      for (const r of [0, 0.3, 0.6, 0.99]) expect(nextMotionPreset(p.id, () => r).id).not.toBe(p.id);
    }
  });
});
