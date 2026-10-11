import { describe, it, expect } from 'vitest';
import { brandHref } from '../brand-routes';

describe('brandHref', () => {
  it('sends Studio brands to the Studio page, whatever the view', () => {
    expect(brandHref({ id: 'abc', source: 'studio' })).toBe('/studio/abc');
    expect(brandHref({ id: 'abc', source: 'studio' }, 'edit')).toBe('/studio/abc');
  });
  it('keeps legacy brands on the presentation or editor', () => {
    expect(brandHref({ id: 'abc' })).toBe('/brands/abc/presentation');
    expect(brandHref({ id: 'abc' }, 'edit')).toBe('/brands/abc');
  });
});
