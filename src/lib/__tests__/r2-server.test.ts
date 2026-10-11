import { describe, it, expect } from 'vitest';
import { extensionForContentType } from '../r2-server';

describe('extensionForContentType', () => {
  it.each([
    ['image/png', 'png'], ['image/webp', 'webp'], ['image/jpeg', 'jpg'],
    ['image/svg+xml', 'svg'], ['application/octet-stream', 'png'],
  ])('%s → %s', (ct, ext) => expect(extensionForContentType(ct)).toBe(ext));
});
