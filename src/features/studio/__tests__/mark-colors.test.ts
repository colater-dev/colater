import { describe, it, expect } from 'vitest';
import { markColorOptions } from '../mark-colors';

const p = (role: string, hex: string) => ({ role, hex, name: role }) as never;

describe('markColorOptions', () => {
  it('cycles primary → secondary → accent → ink, skipping the background', () => {
    const palette = [p('background', '#FFFFFF'), p('ink', '#111111'), p('accent', '#FF0000'), p('primary', '#0000FF'), p('secondary', '#00FF00')];
    expect(markColorOptions(palette).map(c => c.hex)).toEqual(['#0000FF', '#00FF00', '#FF0000', '#111111']);
  });
});
