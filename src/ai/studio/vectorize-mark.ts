import { fal } from '@fal-ai/client';
import { withTimeout } from '@/lib/with-timeout';

export async function vectorizeMark(markUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY is not set');
  fal.config({ credentials: process.env.FAL_KEY.trim() });
  const result = await withTimeout(fal.subscribe('fal-ai/recraft/vectorize', { input: { image_url: markUrl } }), 60_000, 'Vectorize');
  const url = (result.data as { image?: { url: string } })?.image?.url;
  if (!url) throw new Error('Vectorize returned no file');
  const res = await withTimeout(fetch(url), 30_000, 'SVG download');
  if (!res.ok) throw new Error(`SVG download failed (${res.status})`);
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: 'image/svg+xml' };
}
