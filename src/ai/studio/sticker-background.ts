import { withTimeout } from '@/lib/with-timeout';

/** Royalty-free only: CC0 and public-domain-mark images need no licence fee or attribution. */
const ROYALTY_FREE = ['cc0', 'pdm'];

export interface OpenverseImage {
  id: string;
  title?: string | null;
  creator?: string | null;
  license: string;
  width?: number | null;
  height?: number | null;
  thumbnail: string;
  foreign_landing_url?: string | null;
}

export interface StickerBackground {
  url: string;
  title: string | null;
  creator: string | null;
  license: string;
  sourceUrl: string | null;
}

export function buildOpenverseUrl(query: string): string {
  const u = new URL('https://api.openverse.org/v1/images/');
  u.searchParams.set('q', query);
  u.searchParams.set('license', ROYALTY_FREE.join(','));
  u.searchParams.set('category', 'photograph');
  u.searchParams.set('aspect_ratio', 'wide');
  u.searchParams.set('mature', 'false');
  u.searchParams.set('page_size', '20');
  return u.toString();
}

export function pickStickerPhoto(results: OpenverseImage[], random: () => number = Math.random): OpenverseImage | undefined {
  const usable = results.filter(r =>
    ROYALTY_FREE.includes(r.license) && (r.width ?? 0) >= 600 && (r.width ?? 0) > (r.height ?? Infinity) && !!r.thumbnail);
  const top = usable.slice(0, 5);
  return top[Math.floor(random() * top.length)];
}

/**
 * Finds a royalty-free photo of the surface on Openverse and re-hosts its thumbnail
 * (about 600px wide, ~50 KB; plenty for a 320px slide). Null when nothing suitable turns up.
 */
export async function findStickerBackground(
  surface: string,
  uid: string,
  { fetchFn = fetch, upload, random = Math.random }: {
    fetchFn?: (url: string, init?: RequestInit) => Promise<Response>;
    upload: (buffer: Buffer, contentType: string, uid: string) => Promise<string>;
    random?: () => number;
  }
): Promise<StickerBackground | null> {
  const headers = { 'User-Agent': 'Colater/1.0 (brand studio)' };
  const search = await withTimeout(fetchFn(buildOpenverseUrl(surface), { headers }), 10_000, 'Openverse search');
  if (!search.ok) return null;
  const body = (await search.json()) as { results?: OpenverseImage[] };
  const pick = pickStickerPhoto(body.results ?? [], random);
  if (!pick) return null;
  const thumb = await withTimeout(fetchFn(pick.thumbnail, { headers }), 15_000, 'Openverse thumbnail');
  if (!thumb.ok) return null;
  const contentType = thumb.headers.get('content-type') ?? 'image/jpeg';
  const url = await upload(Buffer.from(await thumb.arrayBuffer()), contentType, uid);
  return { url, title: pick.title ?? null, creator: pick.creator ?? null, license: pick.license, sourceUrl: pick.foreign_landing_url ?? null };
}
