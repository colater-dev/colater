/**
 * Logo image models (all served via fal.ai) and their per-model inputs.
 *
 * Downstream processing (crop, invert detection, stickers, colorize, vectorize)
 * assumes a black mark on a white background, so every model is pushed there:
 * via the prompt for all, plus each model's own hard controls where it has them.
 *
 * Shared by client (picker) and server (allowlist + request building) — keep it
 * free of server-only imports.
 */

export const LOGO_MODELS = {
  recraft: { label: 'Recraft V4.1', endpointId: 'fal-ai/recraft/v4.1/text-to-image' },
  'gpt-image': { label: 'GPT Image 1.5', endpointId: 'fal-ai/gpt-image-1.5' },
  'nano-banana': { label: 'Nano Banana Pro', endpointId: 'fal-ai/nano-banana-pro' },
} as const;

export type LogoProvider = keyof typeof LOGO_MODELS;

export const DEFAULT_LOGO_PROVIDER: LogoProvider = 'recraft';

export const LOGO_STYLE_RULE =
  'Flat vector logo mark, centered with generous white margin, filling about 60% of the canvas. Confident, simple, precise geometry with consistent stroke weights and optical balance, like a mark from a curated logo gallery. Strokes, gaps and cut-outs are thick: nothing thinner than one tenth of the mark\'s width, so it still reads at 24px. No words or text.';

export const BLACK_ON_WHITE_RULE =
  'Solid pure black (#000000) logo mark on a plain pure white background. No grey, no other colors, no gradients, no shadows, no texture, no brush strokes, no border or frame.';

export function isLogoProvider(value: unknown): value is LogoProvider {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOGO_MODELS, value);
}

export function buildLogoModelInput(provider: LogoProvider, prompt: string): Record<string, unknown> {
  const fullPrompt = `${prompt} ${LOGO_STYLE_RULE} ${BLACK_ON_WHITE_RULE}`;

  switch (provider) {
    case 'recraft':
      return {
        prompt: fullPrompt,
        image_size: 'square_hd',
        colors: [{ r: 0, g: 0, b: 0 }],
        background_color: { r: 255, g: 255, b: 255 },
      };
    case 'gpt-image':
      return {
        prompt: fullPrompt,
        image_size: '1024x1024',
        background: 'opaque',
        output_format: 'png',
      };
    case 'nano-banana':
      return {
        prompt: fullPrompt,
        aspect_ratio: '1:1',
        output_format: 'png',
        system_prompt: BLACK_ON_WHITE_RULE,
      };
  }
}
