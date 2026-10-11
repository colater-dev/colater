import { describe, it, expect } from 'vitest';
import { buildVoicePrompt } from '../voice';

const brief = { name: 'Tidepool', pitch: 'A calm swim school for toddlers.', audienceTags: ['families'], styleTags: ['calm'], idea: 'Parent and child form a heart.' };

describe('voice', () => {
  it('prompt asks for a short tagline and one-line story about the brand', () => {
    const p = buildVoicePrompt(brief);
    for (const s of ['Tidepool', 'A calm swim school for toddlers.', 'Families', 'max 8 words', 'one sentence']) expect(p).toContain(s);
  });
  it('prompt carries feedback when given', () => {
    expect(buildVoicePrompt({ ...brief, feedback: { chips: ['shorter'] } })).toContain('Feedback: shorter');
  });
});
