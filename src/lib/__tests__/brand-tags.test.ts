import { describe, it, expect } from 'vitest';
import { AUDIENCE_TAGS, STYLE_TAGS, AUDIENCE_MAX, STYLE_MAX, isTagInGroup, tagLabel, sortTagsByScore } from '../brand-tags';

describe('brand tags', () => {
  it('has about 40 audience and 40 style tags with unique snake_case ids', () => {
    expect(AUDIENCE_TAGS.length).toBeGreaterThanOrEqual(36);
    expect(STYLE_TAGS.length).toBeGreaterThanOrEqual(36);
    const ids = [...AUDIENCE_TAGS, ...STYLE_TAGS].map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it('keeps every tag id existing brands may use', () => {
    const old = ['gen_z', 'millennials', 'families', 'students', 'professionals', 'small_business', 'enterprise', 'developers', 'creatives', 'health_conscious', 'outdoor', 'luxury_buyers', 'budget_minded', 'local_community', 'seniors', 'kids'];
    for (const id of old) expect(isTagInGroup('audience', id)).toBe(true);
    const oldStyle = ['minimal', 'playful', 'bold', 'elegant', 'geometric', 'organic', 'techy', 'friendly', 'premium', 'retro', 'handcrafted', 'serious', 'warm', 'edgy', 'calm', 'energetic'];
    for (const id of oldStyle) expect(isTagInGroup('style', id)).toBe(true);
  });

  it('allows up to 8 audiences and 6 styles', () => {
    expect(AUDIENCE_MAX).toBe(8);
    expect(STYLE_MAX).toBe(6);
  });

  it('checks group membership', () => {
    expect(isTagInGroup('audience', 'gen_z')).toBe(true);
    expect(isTagInGroup('style', 'gen_z')).toBe(false);
    expect(isTagInGroup('style', 'playful')).toBe(true);
    expect(isTagInGroup('style', 'not_a_tag')).toBe(false);
  });

  it('returns labels, falling back to the id', () => {
    expect(tagLabel('gen_z')).toBe('Gen Z');
    expect(tagLabel('unknown_thing')).toBe('unknown_thing');
  });
});

describe('sortTagsByScore', () => {
  const tags = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }, { id: 'd', label: 'D' }];
  it('puts the best-fitting tags first and keeps unscored ones in their original order at the end', () => {
    expect(sortTagsByScore(tags, { c: 0.9, a: 0.2, d: 0.6 }).map(t => t.id)).toEqual(['c', 'd', 'a', 'b']);
  });
  it('leaves the order alone without scores', () => {
    expect(sortTagsByScore(tags, {}).map(t => t.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
