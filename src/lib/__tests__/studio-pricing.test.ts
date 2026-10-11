import { describe, it, expect } from 'vitest';
import { studioRoundCost, STUDIO_DIRECTION_REFUND } from '../credits';

describe('studioRoundCost', () => {
  it('charges per direction', () => {
    expect(studioRoundCost(1)).toBe(5);
    expect(studioRoundCost(3)).toBe(15);
    expect(STUDIO_DIRECTION_REFUND).toBe(5);
  });
});
