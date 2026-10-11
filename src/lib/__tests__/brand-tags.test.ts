import { describe, it, expect } from 'vitest';
import { AUDIENCE_TAGS, STYLE_TAGS, isTagInGroup, tagLabel } from '../brand-tags';

describe('brand tags', () => {
  it('has 16 audience and 16 style tags with unique snake_case ids', () => {
    expect(AUDIENCE_TAGS).toHaveLength(16);
    expect(STYLE_TAGS).toHaveLength(16);
    const ids = [...AUDIENCE_TAGS, ...STYLE_TAGS].map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
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
