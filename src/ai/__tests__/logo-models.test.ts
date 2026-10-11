import { describe, it, expect } from 'vitest';
import {
  LOGO_MODELS,
  DEFAULT_LOGO_PROVIDER,
  BLACK_ON_WHITE_RULE,
  isLogoProvider,
  buildLogoModelInput,
} from '../logo-models';

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

describe('logo model registry', () => {
  it('offers exactly Recraft V4.1, GPT Image 1.5 and Nano Banana Pro, defaulting to Recraft', () => {
    expect(Object.keys(LOGO_MODELS).sort()).toEqual(['gpt-image', 'nano-banana', 'recraft']);
    expect(LOGO_MODELS.recraft.endpointId).toBe('fal-ai/recraft/v4.1/text-to-image');
    expect(LOGO_MODELS['gpt-image'].endpointId).toBe('fal-ai/gpt-image-1.5');
    expect(LOGO_MODELS['nano-banana'].endpointId).toBe('fal-ai/nano-banana-pro');
    expect(DEFAULT_LOGO_PROVIDER).toBe('recraft');
  });

  it('only accepts known provider keys (server-side allowlist)', () => {
    expect(isLogoProvider('recraft')).toBe(true);
    expect(isLogoProvider('nano-banana')).toBe(true);
    expect(isLogoProvider('reve')).toBe(false);
    expect(isLogoProvider('fal-ai/some-expensive-video-model')).toBe(false);
    expect(isLogoProvider(undefined)).toBe(false);
    expect(isLogoProvider(42)).toBe(false);
  });
});

describe('buildLogoModelInput', () => {
  it('appends the black-on-white rule to every prompt', () => {
    for (const provider of Object.keys(LOGO_MODELS) as (keyof typeof LOGO_MODELS)[]) {
      const input = buildLogoModelInput(provider, 'A folded paper crane');
      expect(input.prompt).toBe(`A folded paper crane ${BLACK_ON_WHITE_RULE}`);
    }
  });

  it('forces Recraft to a black palette on a white background', () => {
    expect(buildLogoModelInput('recraft', 'p')).toEqual({
      prompt: `p ${BLACK_ON_WHITE_RULE}`,
      image_size: 'square_hd',
      colors: [BLACK],
      background_color: WHITE,
    });
  });

  it('asks GPT Image for an opaque square PNG', () => {
    expect(buildLogoModelInput('gpt-image', 'p')).toEqual({
      prompt: `p ${BLACK_ON_WHITE_RULE}`,
      image_size: '1024x1024',
      background: 'opaque',
      output_format: 'png',
    });
  });

  it('puts the black-on-white rule in Nano Banana system prompt', () => {
    expect(buildLogoModelInput('nano-banana', 'p')).toEqual({
      prompt: `p ${BLACK_ON_WHITE_RULE}`,
      aspect_ratio: '1:1',
      output_format: 'png',
      system_prompt: BLACK_ON_WHITE_RULE,
    });
  });
});
