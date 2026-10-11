import { describe, it, expect } from 'vitest';
import { buildOpenverseUrl, pickStickerPhoto, findStickerBackground } from '../sticker-background';

const photo = (o: Record<string, unknown> = {}) => ({
  id: 'a', title: 'Concrete Wall', creator: 'Jane', license: 'cc0', width: 1200, height: 800,
  thumbnail: 'https://api.openverse.org/v1/images/a/thumb/', foreign_landing_url: 'https://flickr.com/a', ...o,
});
const json = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 429, json: async () => body, arrayBuffer: async () => new ArrayBuffer(0), headers: new Headers() }) as unknown as Response;

describe('buildOpenverseUrl', () => {
  it('asks only for royalty-free (CC0 / public domain) wide photographs', () => {
    const u = new URL(buildOpenverseUrl('concrete wall'));
    expect(u.origin + u.pathname).toBe('https://api.openverse.org/v1/images/');
    expect(u.searchParams.get('q')).toBe('concrete wall');
    expect(u.searchParams.get('license')).toBe('cc0,pdm');
    expect(u.searchParams.get('category')).toBe('photograph');
    expect(u.searchParams.get('aspect_ratio')).toBe('wide');
    expect(u.searchParams.get('mature')).toBe('false');
  });
});

describe('pickStickerPhoto', () => {
  it('skips non-royalty-free, portrait, and tiny photos', () => {
    const results = [
      photo({ id: 'by', license: 'by' }),
      photo({ id: 'tall', width: 600, height: 900 }),
      photo({ id: 'tiny', width: 300, height: 200 }),
      photo({ id: 'ok', license: 'pdm' }),
    ];
    expect(pickStickerPhoto(results, () => 0)?.id).toBe('ok');
  });
  it('picks among the top few results', () => {
    const results = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => photo({ id }));
    expect(pickStickerPhoto(results, () => 0.99)?.id).toBe('e');
  });
  it('is undefined when nothing qualifies', () => {
    expect(pickStickerPhoto([photo({ license: 'by-nc' })], () => 0)).toBeUndefined();
  });
});

describe('findStickerBackground', () => {
  it('uploads the small thumbnail (never the full image) and returns its credit', async () => {
    const fetched: string[] = [];
    const fetchFn = async (url: string) => {
      fetched.push(url);
      return url.includes('/thumb/') ? ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4), headers: new Headers({ 'content-type': 'image/jpeg' }) } as unknown as Response) : json({ results: [photo()] });
    };
    const bg = await findStickerBackground('concrete wall', 'u1', { fetchFn, upload: async (_b, type) => `https://r2.example/bg.${type.split('/')[1]}`, random: () => 0 });
    expect(bg).toEqual({ url: 'https://r2.example/bg.jpeg', title: 'Concrete Wall', creator: 'Jane', license: 'cc0', sourceUrl: 'https://flickr.com/a' });
    expect(fetched[1]).toBe('https://api.openverse.org/v1/images/a/thumb/');
    expect(fetched.some(u => u.includes('full_size'))).toBe(false);
  });
  it('is null when the search fails or finds nothing', async () => {
    const opts = { upload: async () => 'x', random: () => 0 };
    expect(await findStickerBackground('x', 'u', { ...opts, fetchFn: async () => json({}, false) })).toBeNull();
    expect(await findStickerBackground('x', 'u', { ...opts, fetchFn: async () => json({ results: [] }) })).toBeNull();
  });
});
