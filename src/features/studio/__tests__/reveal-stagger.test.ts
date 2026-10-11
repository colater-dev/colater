import { describe, it, expect } from 'vitest';
import { createRevealStagger } from '../reveal-stagger';

describe('createRevealStagger', () => {
  it('staggers slides that become ready together', () => {
    const t = 1000;
    const next = createRevealStagger({ step: 90, now: () => t });
    expect(['a', 'b', 'c'].map(k => next(k))).toEqual([0, 90, 180]);
  });
  it('a lone slide after a pause falls with no delay', () => {
    let t = 1000;
    const next = createRevealStagger({ step: 90, now: () => t });
    next('a'); next('b');
    t += 2000;
    expect(next('c')).toBe(0);
  });
  it('asking twice for the same slide returns the same delay', () => {
    const t = 1000;
    const next = createRevealStagger({ step: 90, now: () => t });
    next('a');
    expect(next('b')).toBe(90);
    expect(next('b')).toBe(90);
    expect(next('c')).toBe(180);
  });
  it('caps the delay for very large batches', () => {
    const t = 1000;
    const next = createRevealStagger({ step: 90, max: 600, now: () => t });
    const delays = Array.from({ length: 20 }, (_, i) => next(`k${i}`));
    expect(Math.max(...delays)).toBe(600);
  });
});
