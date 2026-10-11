import { fal } from '@fal-ai/client';
import { LOGO_MODELS, buildLogoModelInput, type LogoProvider } from '@/ai/logo-models';
import { withTimeout } from '@/lib/with-timeout';

export async function renderMark(provider: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY is not set');
  fal.config({ credentials: process.env.FAL_KEY.trim() });
  const result = await withTimeout(
    fal.subscribe(LOGO_MODELS[provider].endpointId, { input: buildLogoModelInput(provider, prompt) }),
    60_000,
    `${LOGO_MODELS[provider].label} render`
  );
  const url = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
  if (!url) throw new Error(`${LOGO_MODELS[provider].label} returned no image`);
  const res = await withTimeout(fetch(url), 30_000, 'Image download');
  if (!res.ok) throw new Error(`Image download failed (${res.status})`);
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') || 'image/png' };
}
