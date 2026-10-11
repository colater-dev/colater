import { describe, it, expect } from 'vitest';
import { withTimeout } from '../with-timeout';

describe('withTimeout', () => {
  it('resolves when the promise wins', async () => {
    await expect(withTimeout(Promise.resolve(7), 50, 'x')).resolves.toBe(7);
  });
  it('rejects with a labelled error when time runs out', async () => {
    const never = new Promise<never>(() => {});
    await expect(withTimeout(never, 10, 'fal render')).rejects.toThrow('fal render timed out after 10ms');
  });
});
