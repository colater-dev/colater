/** Jev (TypeSafe AI decision model) via Vercel AI Gateway. Server-side only. */
import { withTimeout } from '@/lib/with-timeout';

export type JevQuestion =
  | { type: 'boolean'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string | null> };

export type JevAnswer =
  | { type: 'boolean'; probability: number }
  | { type: 'choice'; choice: string; probabilities?: Record<string, number> };

const JEV_URL = 'https://ai-gateway.vercel.sh/v1/evaluate';

export async function jevEvaluate(
  state: unknown,
  questions: Record<string, JevQuestion>,
  opts: { timeoutMs?: number; fetchImpl?: typeof fetch; apiKey?: string } = {}
): Promise<Record<string, JevAnswer>> {
  const apiKey = opts.apiKey ?? process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY is not set');
  const fetchImpl = opts.fetchImpl ?? fetch;

  const res = await withTimeout(
    fetchImpl(JEV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'typesafe-ai/jev', state, questions }),
    }),
    opts.timeoutMs ?? 10_000,
    'Jev request'
  );
  if (!res.ok) throw new Error(`Jev request failed (${res.status})`);
  const json = (await res.json()) as { answers?: Record<string, JevAnswer> };
  return json.answers ?? {};
}
