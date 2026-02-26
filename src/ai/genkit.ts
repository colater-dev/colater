import {genkit} from 'genkit';
import {anthropic} from '@genkit-ai/anthropic';

export const ai = genkit({
  plugins: [anthropic()],
  // Using Claude Sonnet 4.5 (latest Sonnet) - Note: Opus 4.6 is available but more expensive
  model: 'anthropic/claude-sonnet-4-5-20250929',
});
