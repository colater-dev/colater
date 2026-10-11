import { describe, it, expect, vi } from 'vitest';
import { jevEvaluate } from '../jev';

const okFetch = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('jevEvaluate', () => {
  it('posts model, state and questions with the gateway key and returns answers', async () => {
    const fetchImpl = okFetch({ answers: { q: { type: 'boolean', probability: 0.8 } } });
    const answers = await jevEvaluate({ a: 1 }, { q: { type: 'boolean', instructions: 'ok?' } }, { fetchImpl, apiKey: 'k' });
    expect(answers.q).toEqual({ type: 'boolean', probability: 0.8 });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://ai-gateway.vercel.sh/v1/evaluate');
    expect(init.headers.Authorization).toBe('Bearer k');
    expect(JSON.parse(init.body)).toEqual({ model: 'typesafe-ai/jev', state: { a: 1 }, questions: { q: { type: 'boolean', instructions: 'ok?' } } });
  });
  it('throws on non-2xx', async () => {
    await expect(jevEvaluate({}, {}, { fetchImpl: okFetch({ error: 'x' }, 401), apiKey: 'k' })).rejects.toThrow('Jev request failed (401)');
  });
  it('throws when no key is configured', async () => {
    await expect(jevEvaluate({}, {}, { fetchImpl: okFetch({}), apiKey: '' })).rejects.toThrow('AI_GATEWAY_API_KEY is not set');
  });
});
