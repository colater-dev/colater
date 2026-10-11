import { describe, it, expect } from 'vitest';
import { stageLabel } from '../stage-label';

const recipe = { ideaType: 'lettermark' as const, styleLean: 'bold', model: 'gpt-image' as const };

describe('stageLabel', () => {
  it('describes each in-progress step with the model name', () => {
    expect(stageLabel({ status: 'pending', recipe })).toBe('Starting…');
    expect(stageLabel({ status: 'generating', stage: 'concept', recipe })).toBe('Writing the idea…');
    expect(stageLabel({ status: 'generating', stage: 'mark', recipe })).toBe('Drawing the mark with GPT Image 1.5…');
  });
  it('returns null once ready or failed', () => {
    expect(stageLabel({ status: 'ready', stage: 'mark', recipe })).toBeNull();
    expect(stageLabel({ status: 'failed', recipe })).toBeNull();
  });
});
