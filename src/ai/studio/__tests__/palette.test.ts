import { describe, it, expect } from 'vitest';
import { feedbackLine } from '../palette';

describe('feedbackLine', () => {
  it('is null without feedback', () => {
    expect(feedbackLine()).toBeNull();
    expect(feedbackLine({ chips: [] })).toBeNull();
  });
  it('joins chips and note', () => {
    expect(feedbackLine({ chips: ['warmer'], note: 'less pink' })).toBe('Feedback: warmer. Note: less pink');
  });
});
