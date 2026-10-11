# Studio Phases 1–3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the core Studio experience — name + one sentence + Jev-suggested tags → a round of 3 visually distinct logo directions generated server-side (credits charged/refunded on the server) → pick one, see free auto-generated slides, ask for new directions.

**Architecture:** Server actions verify the Firebase ID token and brand ownership, charge credits with the Admin SDK (idempotent, refundable), write `pending` round/direction docs, then continue work in Next's `after()`: Claude writes each direction's concept, fal renders the mark, the server uploads it to R2, and Jev picks a font. The client renders purely from Firestore listeners. Free slides (lockup, in-use, typography) are rendered in the browser from the mark + font.

**Tech Stack:** Next.js 16 (App Router, server actions, `after()`), React 19, Firebase Admin + client SDK, Firestore emulator, Genkit + Anthropic (Claude Sonnet 4.5), fal.ai (`@fal-ai/client`), Cloudflare R2 (`@aws-sdk/client-s3`), Vercel AI Gateway → Jev (`typesafe-ai/jev`, HTTP `/v1/evaluate`), Vitest, Tailwind/shadcn.

**Spec:** `docs/superpowers/specs/2026-10-11-studio-brand-flow-design.md` (sections 3–9; this plan = build-order phases 1–3).

## Global Constraints

- Work on branch `studio-flow`; never commit to `main`. Commit after each task. End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never commit `.env`, `.claude/`, or the scratchpad.
- Credits are **server-write-only**: clients may read `userProfiles/{uid}` and its `transactions`, never write them.
- Round of 3 directions costs **15** credits; a failed direction refunds **5**. Tag suggestions are free.
- Jev: `POST https://ai-gateway.vercel.sh/v1/evaluate`, `Authorization: Bearer $AI_GATEWAY_API_KEY`, model `typesafe-ai/jev`. Tag pre-select threshold **0.6**, max **3** per group.
- Timeouts: fal **60s**, Claude **45s**, Jev **10s**.
- Logo models only via `src/ai/logo-models.ts` (`recraft` | `gpt-image` | `nano-banana`); every mark is black on white.
- Captions ≤ 12 words. Slides are 16:9 frames that size text with container-query units (`containerType: 'inline-size'` + `cqw`).
- Run checks with `npm run typecheck && npm run lint && npm test`. Emulator-backed tests: start emulators (`PATH="/opt/homebrew/opt/openjdk/bin:$PATH" npm run emulators`) then `npm run test:emulator`.

## Review Focus

- **Double submit / re-render** of "Show me 3 directions" or "New directions" → exactly one charge and one round (idempotent `clientRoundId`). Pinned by Task 4's "charges once per key" test + Task 10 manual step 7.
- **One direction's model fails** (fal 404/timeout) → that row shows a failed state with its 5 credits refunded; the other two finish. Pinned by Task 7's "fails only the broken direction" test.
- **User with 0–14 credits** starts a round → nothing charged, nothing written, clear "not enough credits" message. Pinned by Task 4's "refuses when the balance is too low" test (startRound charges before writing anything).
- **Jev unavailable / key missing** → start screen still works with no pre-selection. Pinned by Task 2's jev error tests; `suggestTags` (Task 8) catches and returns empty lists.
- **Old editor + presentation keep working** after the credit rules lock-down (they now charge via server action). Pinned in Task 5 rules tests + manual check.

---

## File Structure

```
src/lib/brand-tags.ts                     preset audience/style tags (pure)
src/lib/tag-suggestions.ts                Jev questions for tags + threshold selection (pure)
src/lib/with-timeout.ts                   promise timeout helper (pure)
src/lib/server-credits.ts                 Admin-SDK credits: ensureProfile/charge/refund (idempotent)
src/lib/r2-server.ts                      server-side R2 upload of a Buffer
src/ai/jev.ts                             Jev HTTP client (server)
src/ai/studio/recipes.ts                  idea types + pickRecipes (pure)
src/ai/studio/direction-concept.ts        prompt builder (pure) + Claude call
src/ai/studio/render-mark.ts              fal render → Buffer
src/ai/studio/pick-font.ts                Jev choice over BRAND_FONTS
src/ai/studio/run-round.ts                background pipeline (deps injected)
src/app/actions/credits.ts                ensureCreditProfile / spendCredits server actions (legacy pages)
src/app/studio/actions.ts                 suggestTags / createStudioBrand / startRound / pickDirection
src/app/studio/new/page.tsx + start-client.tsx
src/app/studio/[brandId]/page.tsx + studio-client.tsx
src/features/studio/types.ts
src/features/studio/hooks/use-studio-data.ts
src/features/studio/components/{tag-picker,round-block,direction-row,slide-frame}.tsx
src/features/studio/components/slides/{mark,lockup,in-use,typography}-slide.tsx
tests: next to code in __tests__/ ; emulator tests named *.emulator.test.ts
```

---

### Task 0: Branch and commit existing groundwork

**Files:** none new.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b studio-flow
```

- [ ] **Step 2: Commit the earlier fixes (admin init + concept loop + Reve removal)**

```bash
git add src/firebase/service-account.ts src/firebase/__tests__/service-account.test.ts src/firebase/server.ts
git commit -m "fix: initialize Firebase Admin from snake_case service-account JSON

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Commit the logo model update** (includes the concept auto-generate guard and prompt fixes in the same files)

```bash
git add src/ai/logo-models.ts src/ai/__tests__/logo-models.test.ts src/ai/flows/generate-logo-fal.ts src/ai/flows/generate-logo-concept.ts src/ai/flows/generate-logo.ts src/ai/flows/generate-logo-openai.ts src/app/actions.ts "src/app/brands/[brandId]/brand-detail-client.tsx" "src/app/brands/[brandId]/logos/[logoId]/logo-detail-client.tsx" src/features/brands/components/brand-identity-card.tsx src/features/brands/components/brand-identity-header.tsx
git commit -m "feat: switch logo models to Recraft V4.1 / GPT Image 1.5 / Nano Banana Pro with black-on-white enforcement

- server-side allowlist of logo providers
- remove fake Gemini/OpenAI options and broken Reve
- fix contradictory white-on-black concept prompt
- stop concept auto-generation from looping and draining credits

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Commit the emulator setup and docs**

```bash
git add firebase.json package.json src/firebase/index.ts src/features/auth/components/dev-email-login.tsx src/app/landing-page-client.tsx scripts/emulator-test-user.json docs/SPEC.md docs/superpowers
git commit -m "chore: local Firebase emulators + dev login; add current-state spec and Studio design

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Verify** — `git status` shows only `firestore.rules`, `src/components/layout/app-header.tsx` (owner's WIP, replaced in Task 5) and untracked `.claude/`.

---

### Task 1: Preset tags

**Files:**
- Create: `src/lib/brand-tags.ts`
- Test: `src/lib/__tests__/brand-tags.test.ts`

**Interfaces:**
- Produces: `type TagGroup = 'audience' | 'style'`; `interface BrandTag { id: string; label: string }`; `AUDIENCE_TAGS: readonly BrandTag[]`; `STYLE_TAGS: readonly BrandTag[]`; `isTagInGroup(group: TagGroup, id: string): boolean`; `tagLabel(id: string): string`.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/lib/__tests__/brand-tags.test.ts` → FAIL "Cannot find module '../brand-tags'".

- [ ] **Step 3: Implement**

```ts
/** Preset tags users pick from on the Studio start screen (no free text). */
export type TagGroup = 'audience' | 'style';

export interface BrandTag {
  id: string;
  label: string;
}

export const AUDIENCE_TAGS: readonly BrandTag[] = [
  { id: 'gen_z', label: 'Gen Z' },
  { id: 'millennials', label: 'Millennials' },
  { id: 'families', label: 'Families' },
  { id: 'students', label: 'Students' },
  { id: 'professionals', label: 'Professionals' },
  { id: 'small_business', label: 'Small businesses' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'developers', label: 'Developers' },
  { id: 'creatives', label: 'Creatives' },
  { id: 'health_conscious', label: 'Health-conscious' },
  { id: 'outdoor', label: 'Outdoor lovers' },
  { id: 'luxury_buyers', label: 'Luxury buyers' },
  { id: 'budget_minded', label: 'Budget-minded' },
  { id: 'local_community', label: 'Local community' },
  { id: 'seniors', label: 'Seniors' },
  { id: 'kids', label: 'Kids' },
];

export const STYLE_TAGS: readonly BrandTag[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'playful', label: 'Playful' },
  { id: 'bold', label: 'Bold' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'organic', label: 'Organic' },
  { id: 'techy', label: 'Techy' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'premium', label: 'Premium' },
  { id: 'retro', label: 'Retro' },
  { id: 'handcrafted', label: 'Handcrafted' },
  { id: 'serious', label: 'Serious' },
  { id: 'warm', label: 'Warm' },
  { id: 'edgy', label: 'Edgy' },
  { id: 'calm', label: 'Calm' },
  { id: 'energetic', label: 'Energetic' },
];

const GROUPS: Record<TagGroup, readonly BrandTag[]> = { audience: AUDIENCE_TAGS, style: STYLE_TAGS };

export function isTagInGroup(group: TagGroup, id: string): boolean {
  return GROUPS[group].some(t => t.id === id);
}

export function tagLabel(id: string): string {
  return [...AUDIENCE_TAGS, ...STYLE_TAGS].find(t => t.id === id)?.label ?? id;
}
```

- [ ] **Step 4: Run to verify it passes** — same command → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/brand-tags.ts src/lib/__tests__/brand-tags.test.ts
git commit -m "feat(studio): preset audience and style tags

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Jev client + tag suggestions + timeout helper

**Files:**
- Create: `src/lib/with-timeout.ts`, `src/ai/jev.ts`, `src/lib/tag-suggestions.ts`
- Test: `src/lib/__tests__/with-timeout.test.ts`, `src/lib/__tests__/tag-suggestions.test.ts`, `src/ai/__tests__/jev.test.ts`

**Interfaces:**
- Consumes: `AUDIENCE_TAGS`, `STYLE_TAGS`, `TagGroup` (Task 1).
- Produces:
  - `withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T>`
  - `type JevQuestion = { type: 'boolean'; instructions: string } | { type: 'choice'; instructions: string; criteria: Record<string, string | null> }`
  - `type JevAnswer = { type: 'boolean'; probability: number } | { type: 'choice'; choice: string; probabilities?: Record<string, number> }`
  - `jevEvaluate(state: unknown, questions: Record<string, JevQuestion>, opts?: { timeoutMs?: number; fetchImpl?: typeof fetch; apiKey?: string }): Promise<Record<string, JevAnswer>>`
  - `buildTagQuestions(): Record<string, JevQuestion>` (keys `audience__<id>` / `style__<id>`)
  - `selectSuggestedTags(answers: Record<string, JevAnswer>, opts?: { threshold?: number; max?: number }): { audience: string[]; style: string[] }`

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/with-timeout.test.ts`:
```ts
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
```

`src/lib/__tests__/tag-suggestions.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildTagQuestions, selectSuggestedTags } from '../tag-suggestions';
import { AUDIENCE_TAGS, STYLE_TAGS } from '../brand-tags';

describe('buildTagQuestions', () => {
  it('asks one boolean question per tag', () => {
    const q = buildTagQuestions();
    expect(Object.keys(q)).toHaveLength(AUDIENCE_TAGS.length + STYLE_TAGS.length);
    expect(q['audience__gen_z']).toEqual({ type: 'boolean', instructions: 'Is "Gen Z" a fitting target audience for this brand?' });
    expect(q['style__playful']).toEqual({ type: 'boolean', instructions: "Should this brand's visual identity feel playful?" });
  });
});

describe('selectSuggestedTags', () => {
  const b = (p: number) => ({ type: 'boolean' as const, probability: p });
  it('keeps tags at or above the threshold, highest first, max 3 per group', () => {
    const answers = {
      audience__gen_z: b(0.9), audience__students: b(0.6), audience__creatives: b(0.75),
      audience__families: b(0.65), audience__enterprise: b(0.05),
      style__playful: b(0.88), style__corporate_typo: b(0.99), style__serious: b(0.1),
    };
    expect(selectSuggestedTags(answers)).toEqual({
      audience: ['gen_z', 'creatives', 'families'],
      style: ['playful'],
    });
  });
  it('ignores unknown keys and non-boolean answers', () => {
    expect(selectSuggestedTags({ weird: b(1), style__bold: { type: 'choice', choice: 'x' } })).toEqual({ audience: [], style: [] });
  });
});
```

`src/ai/__tests__/jev.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run src/lib/__tests__/with-timeout.test.ts src/lib/__tests__/tag-suggestions.test.ts src/ai/__tests__/jev.test.ts` → FAIL (modules missing).

- [ ] **Step 3: Implement**

`src/lib/with-timeout.ts`:
```ts
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
```

`src/ai/jev.ts`:
```ts
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
```

`src/lib/tag-suggestions.ts`:
```ts
import type { JevAnswer, JevQuestion } from '@/ai/jev';
import { AUDIENCE_TAGS, STYLE_TAGS, isTagInGroup, type TagGroup } from './brand-tags';

export function buildTagQuestions(): Record<string, JevQuestion> {
  const questions: Record<string, JevQuestion> = {};
  for (const t of AUDIENCE_TAGS) {
    questions[`audience__${t.id}`] = { type: 'boolean', instructions: `Is "${t.label}" a fitting target audience for this brand?` };
  }
  for (const t of STYLE_TAGS) {
    questions[`style__${t.id}`] = { type: 'boolean', instructions: `Should this brand's visual identity feel ${t.label.toLowerCase()}?` };
  }
  return questions;
}

export function selectSuggestedTags(
  answers: Record<string, JevAnswer>,
  { threshold = 0.6, max = 3 }: { threshold?: number; max?: number } = {}
): { audience: string[]; style: string[] } {
  const scored: Record<TagGroup, { id: string; p: number }[]> = { audience: [], style: [] };
  for (const [key, answer] of Object.entries(answers)) {
    const [group, id] = key.split('__') as [TagGroup, string];
    if ((group !== 'audience' && group !== 'style') || !id || !isTagInGroup(group, id)) continue;
    if (answer.type !== 'boolean' || answer.probability < threshold) continue;
    scored[group].push({ id, p: answer.probability });
  }
  const top = (list: { id: string; p: number }[]) => list.sort((a, b) => b.p - a.p).slice(0, max).map(x => x.id);
  return { audience: top(scored.audience), style: top(scored.style) };
}
```

- [ ] **Step 4: Run to verify they pass** — same command → PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/with-timeout.ts src/ai/jev.ts src/lib/tag-suggestions.ts src/lib/__tests__/with-timeout.test.ts src/lib/__tests__/tag-suggestions.test.ts src/ai/__tests__/jev.test.ts
git commit -m "feat(studio): Jev client and tag suggestion selection

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Recipes (direction diversity)

**Files:**
- Create: `src/ai/studio/recipes.ts`
- Test: `src/ai/studio/__tests__/recipes.test.ts`

**Interfaces:**
- Consumes: `LOGO_MODELS`, `LogoProvider` from `src/ai/logo-models.ts`.
- Produces: `IDEA_TYPES` (`'literal-symbol' | 'abstract-geometric' | 'lettermark' | 'negative-space'`), `type IdeaType`, `IDEA_TYPE_GUIDANCE: Record<IdeaType, string>`, `interface Recipe { ideaType: IdeaType; styleLean: string; model: LogoProvider }`, `pickRecipes(styleTags: string[], random?: () => number): Recipe[]` (always 3).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { pickRecipes, IDEA_TYPES } from '../recipes';
import { LOGO_MODELS } from '@/ai/logo-models';

function seeded(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

describe('pickRecipes', () => {
  it('returns 3 recipes with 3 different models and 3 different idea types', () => {
    for (let s = 1; s < 50; s++) {
      const r = pickRecipes(['playful', 'bold'], seeded(s));
      expect(r).toHaveLength(3);
      expect(new Set(r.map(x => x.model))).toEqual(new Set(Object.keys(LOGO_MODELS)));
      expect(new Set(r.map(x => x.ideaType)).size).toBe(3);
      for (const x of r) expect(IDEA_TYPES).toContain(x.ideaType);
    }
  });
  it('spreads style leans across the chosen tags', () => {
    const r = pickRecipes(['playful', 'bold', 'warm'], seeded(3));
    expect(new Set(r.map(x => x.styleLean))).toEqual(new Set(['playful', 'bold', 'warm']));
  });
  it('falls back to minimal when no style tags are given', () => {
    expect(pickRecipes([], seeded(1)).every(x => x.styleLean === 'minimal')).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/ai/studio` → FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
import { LOGO_MODELS, type LogoProvider } from '@/ai/logo-models';

export const IDEA_TYPES = ['literal-symbol', 'abstract-geometric', 'lettermark', 'negative-space'] as const;
export type IdeaType = (typeof IDEA_TYPES)[number];

export const IDEA_TYPE_GUIDANCE: Record<IdeaType, string> = {
  'literal-symbol': 'A simplified, recognizable object or creature that directly represents what the brand does.',
  'abstract-geometric': 'An abstract mark built from a few geometric shapes that evokes the brand feeling rather than depicting an object.',
  lettermark: "A monogram built from the brand name's first letter (or two initials), shaped to carry the brand idea.",
  'negative-space': 'A mark where a second meaningful shape appears in the empty space inside or between the main forms.',
};

export interface Recipe {
  ideaType: IdeaType;
  styleLean: string;
  model: LogoProvider;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Three diverse recipes: every model once, three different idea types, style leans spread over the user's tags. */
export function pickRecipes(styleTags: string[], random: () => number = Math.random): Recipe[] {
  const models = shuffle(Object.keys(LOGO_MODELS) as LogoProvider[], random);
  const ideas = shuffle(IDEA_TYPES, random).slice(0, 3);
  const leans = styleTags.length ? shuffle(styleTags, random) : ['minimal'];
  return [0, 1, 2].map(i => ({ ideaType: ideas[i], model: models[i], styleLean: leans[i % leans.length] }));
}
```

- [ ] **Step 4: Run to verify it passes** — `npx vitest run src/ai/studio` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/studio/recipes.ts src/ai/studio/__tests__/recipes.test.ts
git commit -m "feat(studio): diverse direction recipes (idea type x style lean x model)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Server-side credits (idempotent charge + refund)

**Files:**
- Create: `src/lib/server-credits.ts`
- Modify: `src/lib/credits.ts` (add `studioRound`)
- Modify: `package.json` (add `test:emulator` script)
- Test: `src/lib/__tests__/server-credits.emulator.test.ts`

**Interfaces:**
- Produces:
  - `class InsufficientCreditsError extends Error { needed: number; balance: number }`
  - `createServerCredits(db: Firestore)` → `{ ensureProfile(uid: string): Promise<number>; charge(args: { uid: string; amount: number; action: CreditAction; key: string }): Promise<{ balance: number; alreadyCharged: boolean }>; refund(args: { uid: string; key: string; amount: number; reason: string }): Promise<{ balance: number; refunded: number }> }`
  - `CREDIT_COSTS.studioRound = 15`, `STUDIO_DIRECTION_REFUND = 5` (exported from `src/lib/credits.ts`).
- Firestore: `userProfiles/{uid}` `{balance,totalPurchased,totalUsed,updatedAt}`; `userProfiles/{uid}/charges/{key}` `{amount, refunded, action, createdAt}`; ledger `userProfiles/{uid}/transactions/{autoId}`.

- [ ] **Step 1: Add the cost constants** in `src/lib/credits.ts`:

```ts
// in CREDIT_COSTS:
  studioRound: 15,
// in CREDIT_ACTION_LABELS:
  studioRound: 'Studio round (3 directions)',
// after CREDIT_COSTS:
/** Refund per failed direction in a Studio round (15 / 3). */
export const STUDIO_DIRECTION_REFUND = 5;
```

- [ ] **Step 2: Add the emulator test script** to `package.json` scripts:

```json
"test:emulator": "FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 vitest run emulator"
```

- [ ] **Step 3: Write the failing test** `src/lib/__tests__/server-credits.emulator.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createServerCredits, InsufficientCreditsError } from '../server-credits';
import { INITIAL_CREDITS } from '../credits';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!ON)('server credits (emulator)', () => {
  let db: Firestore;
  const uid = () => `test_${Math.random().toString(36).slice(2)}`;

  beforeAll(() => {
    const app = getApps().find(a => a.name === 'credits-test') ??
      initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'credits-test');
    db = getFirestore(app);
  });

  it('creates a profile with welcome credits once', async () => {
    const c = createServerCredits(db); const u = uid();
    expect(await c.ensureProfile(u)).toBe(INITIAL_CREDITS);
    expect(await c.ensureProfile(u)).toBe(INITIAL_CREDITS);
    const ledger = await db.collection(`userProfiles/${u}/transactions`).get();
    expect(ledger.size).toBe(1);
  });

  it('charges once per key, even when called twice', async () => {
    const c = createServerCredits(db); const u = uid();
    const first = await c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'round_a' });
    const second = await c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'round_a' });
    expect(first).toEqual({ balance: INITIAL_CREDITS - 15, alreadyCharged: false });
    expect(second).toEqual({ balance: INITIAL_CREDITS - 15, alreadyCharged: true });
  });

  it('refuses when the balance is too low and writes nothing', async () => {
    const c = createServerCredits(db); const u = uid();
    await c.ensureProfile(u);
    await db.doc(`userProfiles/${u}`).update({ balance: 14 });
    await expect(c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'k' })).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect((await db.doc(`userProfiles/${u}/charges/k`).get()).exists).toBe(false);
    expect((await db.doc(`userProfiles/${u}`).get()).data()?.balance).toBe(14);
  });

  it('refunds partially, never more than was charged', async () => {
    const c = createServerCredits(db); const u = uid();
    await c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'r' });
    expect((await c.refund({ uid: u, key: 'r', amount: 5, reason: 'direction failed' })).refunded).toBe(5);
    expect((await c.refund({ uid: u, key: 'r', amount: 20, reason: 'x' })).refunded).toBe(10);
    expect((await c.refund({ uid: u, key: 'r', amount: 5, reason: 'x' })).refunded).toBe(0);
    expect((await db.doc(`userProfiles/${u}`).get()).data()?.balance).toBe(INITIAL_CREDITS);
  });
});
```

- [ ] **Step 4: Run to verify it fails** — with emulators running: `npm run test:emulator` → FAIL (module missing).

- [ ] **Step 5: Implement** `src/lib/server-credits.ts`:

```ts
/** Credits ledger written only by the server (Admin SDK). Charges are idempotent by key and refundable. */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { INITIAL_CREDITS, CREDIT_ACTION_LABELS, type CreditAction } from './credits';

export class InsufficientCreditsError extends Error {
  constructor(public needed: number, public balance: number) {
    super(`Not enough credits: need ${needed}, have ${balance}`);
    this.name = 'InsufficientCreditsError';
  }
}

export function createServerCredits(db: Firestore) {
  const profileRef = (uid: string) => db.doc(`userProfiles/${uid}`);
  const ledgerRef = (uid: string) => db.collection(`userProfiles/${uid}/transactions`).doc();
  const chargeRef = (uid: string, key: string) => db.doc(`userProfiles/${uid}/charges/${key}`);

  async function ensureProfile(uid: string): Promise<number> {
    return db.runTransaction(async tx => {
      const snap = await tx.get(profileRef(uid));
      if (snap.exists) return snap.data()?.balance ?? 0;
      tx.create(profileRef(uid), { balance: INITIAL_CREDITS, totalPurchased: 0, totalUsed: 0, updatedAt: FieldValue.serverTimestamp() });
      tx.create(ledgerRef(uid), { userId: uid, amount: INITIAL_CREDITS, balance: INITIAL_CREDITS, action: 'initial', description: 'Welcome credits', createdAt: FieldValue.serverTimestamp() });
      return INITIAL_CREDITS;
    });
  }

  async function charge({ uid, amount, action, key }: { uid: string; amount: number; action: CreditAction; key: string }) {
    await ensureProfile(uid);
    return db.runTransaction(async tx => {
      const [profile, existing] = await Promise.all([tx.get(profileRef(uid)), tx.get(chargeRef(uid, key))]);
      const balance: number = profile.data()?.balance ?? 0;
      if (existing.exists) return { balance, alreadyCharged: true };
      if (balance < amount) throw new InsufficientCreditsError(amount, balance);
      const newBalance = balance - amount;
      tx.update(profileRef(uid), { balance: newBalance, totalUsed: FieldValue.increment(amount), updatedAt: FieldValue.serverTimestamp() });
      tx.create(chargeRef(uid, key), { amount, refunded: 0, action, createdAt: FieldValue.serverTimestamp() });
      tx.create(ledgerRef(uid), { userId: uid, amount: -amount, balance: newBalance, action, description: CREDIT_ACTION_LABELS[action], createdAt: FieldValue.serverTimestamp() });
      return { balance: newBalance, alreadyCharged: false };
    });
  }

  async function refund({ uid, key, amount, reason }: { uid: string; key: string; amount: number; reason: string }) {
    return db.runTransaction(async tx => {
      const [profile, chargeSnap] = await Promise.all([tx.get(profileRef(uid)), tx.get(chargeRef(uid, key))]);
      const balance: number = profile.data()?.balance ?? 0;
      if (!chargeSnap.exists) return { balance, refunded: 0 };
      const { amount: charged = 0, refunded: already = 0, action } = chargeSnap.data() ?? {};
      const refundable = Math.max(0, Math.min(amount, charged - already));
      if (refundable === 0) return { balance, refunded: 0 };
      const newBalance = balance + refundable;
      tx.update(profileRef(uid), { balance: newBalance, totalUsed: FieldValue.increment(-refundable), updatedAt: FieldValue.serverTimestamp() });
      tx.update(chargeRef(uid, key), { refunded: already + refundable });
      tx.create(ledgerRef(uid), { userId: uid, amount: refundable, balance: newBalance, action, description: `Refund: ${reason}`, createdAt: FieldValue.serverTimestamp() });
      return { balance: newBalance, refunded: refundable };
    });
  }

  return { ensureProfile, charge, refund };
}

export type ServerCredits = ReturnType<typeof createServerCredits>;
```

- [ ] **Step 6: Run to verify it passes** — `npm run test:emulator` → PASS (4 tests). Also `npm test` → emulator suite reported as skipped, everything else passes.

- [ ] **Step 7: Commit**

```bash
git add src/lib/server-credits.ts src/lib/credits.ts src/lib/__tests__/server-credits.emulator.test.ts package.json
git commit -m "feat(credits): idempotent server-side charge and refund

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Lock credits to the server (rules + legacy pages)

**Files:**
- Create: `src/app/actions/credits.ts`, `src/__tests__/firestore-rules.emulator.test.ts`
- Modify: `firestore.rules` (userProfiles, transactions, new rounds/directions read rules)
- Modify: `src/hooks/use-credits.ts`, `"src/app/brands/[brandId]/brand-detail-client.tsx"` (`tryDeductCredits`), `"src/app/brands/[brandId]/presentation/presentation-client.tsx"` (deduct call ~line 100), `src/components/layout/app-header.tsx` ("+" button)
- Dev dep: `@firebase/rules-unit-testing`

**Interfaces:**
- Consumes: `createServerCredits`, `InsufficientCreditsError` (Task 4); `requireServerAuth` (`src/lib/server-auth.ts`); `adminDb` (`src/firebase/server.ts`); `purchaseCredits` (`src/app/actions.ts`).
- Produces: server actions `ensureCreditProfile(idToken: string): Promise<{ success: boolean; balance?: number; error?: string }>` and `spendCredits(idToken: string, action: CreditAction): Promise<{ success: boolean; balance?: number; error?: string; insufficient?: boolean }>`.

- [ ] **Step 1: Install the rules test library**

```bash
npm install --save-dev --save-exact @firebase/rules-unit-testing@4.0.1
```

- [ ] **Step 2: Write the failing rules test** `src/__tests__/firestore-rules.emulator.test.ts`:

```ts
import { describe, it, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!ON)('firestore rules (emulator)', () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(':');
    env = await initializeTestEnvironment({
      projectId: 'demo-colater-rules',
      firestore: { rules: readFileSync('firestore.rules', 'utf8'), host, port: Number(port) },
    });
    await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'userProfiles/alice'), { balance: 50, totalUsed: 0, totalPurchased: 0 });
      await setDoc(doc(db, 'users/alice/brands/b1'), { userId: 'alice', latestName: 'X' });
      await setDoc(doc(db, 'users/alice/brands/b1/rounds/r1'), { createdAt: 1 });
      await setDoc(doc(db, 'users/alice/brands/b1/directions/d1'), { roundId: 'r1' });
    });
  });
  afterAll(async () => { await env?.cleanup(); });

  const alice = () => env.authenticatedContext('alice').firestore();
  const bob = () => env.authenticatedContext('bob').firestore();

  it('owner can read but not write credit balance or ledger', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'userProfiles/alice')));
    await assertFails(updateDoc(doc(alice(), 'userProfiles/alice'), { balance: 9999 }));
    await assertFails(setDoc(doc(alice(), 'userProfiles/alice'), { balance: 9999 }));
    await assertFails(addDoc(collection(alice(), 'userProfiles/alice/transactions'), { amount: 9999 }));
    await assertFails(getDoc(doc(alice(), 'userProfiles/alice/charges/x')));
  });

  it('owner can read rounds and directions; nobody can write them from the client', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/brands/b1/rounds/r1')));
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/brands/b1/directions/d1')));
    await assertFails(getDoc(doc(bob(), 'users/alice/brands/b1/directions/d1')));
    await assertFails(updateDoc(doc(alice(), 'users/alice/brands/b1/directions/d1'), { picked: true }));
    await assertFails(setDoc(doc(alice(), 'users/alice/brands/b1/rounds/r2'), { createdAt: 2 }));
  });

  it('learning collections are server-only', async () => {
    await assertFails(getDoc(doc(alice(), 'recipeStats/global__lettermark__recraft')));
    await assertFails(setDoc(doc(alice(), 'events/e1'), { type: 'picked' }));
  });
});
```

- [ ] **Step 3: Run to verify it fails** — `npm run test:emulator` → the first two cases FAIL (current rules allow balance writes and have no rounds/directions match).

- [ ] **Step 4: Update `firestore.rules`.** Replace the whole `match /userProfiles/{userId} { ... }` block with:

```
    /**
     * @description Credit profiles. Read-only for the owner; all writes go through
     * server actions using the Admin SDK (src/lib/server-credits.ts).
     */
    match /userProfiles/{userId} {
      allow get: if isOwner(userId);
      allow list, create, update, delete: if false;

      match /transactions/{transactionId} {
        allow get, list: if isOwner(userId);
        allow create, update, delete: if false;
      }
      // charges/{key} has no match block: denied to clients.
    }
```

Inside `match /brands/{brandId}` under `/users/{userId}` (the same level as the existing `logoGenerations` match), add:

```
        /**
         * @description Studio rounds and directions. Written only by server actions.
         */
        match /rounds/{roundId} {
          allow get, list: if isOwner(userId);
          allow create, update, delete: if false;
        }
        match /directions/{directionId} {
          allow get, list: if isOwner(userId);
          allow create, update, delete: if false;
        }
```

(`recipeStats` and `events` get no match blocks → denied to clients.)

- [ ] **Step 5: Run rules tests** — `npm run test:emulator` → PASS (rules file is read fresh by the test env).

- [ ] **Step 6: Create the server actions** `src/app/actions/credits.ts`:

```ts
'use server';

import { randomUUID } from 'node:crypto';
import { adminDb } from '@/firebase/server';
import { requireServerAuth } from '@/lib/server-auth';
import { createServerCredits, InsufficientCreditsError } from '@/lib/server-credits';
import { CREDIT_COSTS, type CreditAction } from '@/lib/credits';

export async function ensureCreditProfile(idToken: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const { uid } = await requireServerAuth(idToken);
    return { success: true, balance: await createServerCredits(adminDb).ensureProfile(uid) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not load credits' };
  }
}

/** Legacy pages (editor, presentation): charge a fixed action cost on the server. */
export async function spendCredits(
  idToken: string,
  action: CreditAction
): Promise<{ success: boolean; balance?: number; error?: string; insufficient?: boolean }> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!(action in CREDIT_COSTS)) return { success: false, error: 'Unknown action' };
    const { balance } = await createServerCredits(adminDb).charge({ uid, amount: CREDIT_COSTS[action], action, key: `spend_${randomUUID()}` });
    return { success: true, balance };
  } catch (error) {
    if (error instanceof InsufficientCreditsError) return { success: false, insufficient: true, error: error.message };
    return { success: false, error: error instanceof Error ? error.message : 'Could not charge credits' };
  }
}
```

- [ ] **Step 7: Point the client at the server actions.**

`src/hooks/use-credits.ts` — replace the auto-initialize effect body:
```ts
import { ensureCreditProfile } from '@/app/actions/credits';
// inside useCredits():
  const initRequested = useRef(false);
  useEffect(() => {
    if (user && !isLoading && !profile && !initRequested.current) {
      initRequested.current = true;
      user.getIdToken().then(ensureCreditProfile).catch(console.error);
    }
  }, [user, isLoading, profile]);
```
(add `useRef` to the React import; keep returning `creditsService` for read helpers such as the transactions query.)

`brand-detail-client.tsx` — inside `tryDeductCredits`, replace `await creditsService.deductCredits(user.uid, action); return true;` with:
```ts
            const result = await spendCredits(await user.getIdToken(), action);
            if (result.success) return true;
            throw new Error(result.error);
```
and add `import { spendCredits } from '@/app/actions/credits';`. Remove `creditsService` from the hook destructure and the `useCallback` deps.

`presentation-client.tsx` — replace `await creditsService.deductCredits(user.uid, 'presentationNarrative');` with:
```ts
                    const charge = await spendCredits(await user.getIdToken(), 'presentationNarrative');
                    if (!charge.success) throw new Error(charge.error);
```
plus the same import.

`src/components/layout/app-header.tsx` — change the "+" button's `onClick` to use the server mock purchase:
```tsx
                        onClick={async () => {
                            if (user) await purchaseCredits(await user.getIdToken(), 'pack-50').catch(console.error);
                        }}
                        title="Add 50 credits (mock purchase)"
```
add `import { purchaseCredits } from '@/app/actions';` and drop `creditsService` from the `useCredits()` destructure.

- [ ] **Step 8: Verify** — `npm run typecheck && npm run lint && npm test` → all pass. Manual: on `localhost:3001` (emulators), sign in as the test user, confirm balance shows 50, click "+", confirm 100.

- [ ] **Step 9: Commit**

```bash
git add firestore.rules src/app/actions/credits.ts src/__tests__/firestore-rules.emulator.test.ts src/hooks/use-credits.ts "src/app/brands/[brandId]/brand-detail-client.tsx" "src/app/brands/[brandId]/presentation/presentation-client.tsx" src/components/layout/app-header.tsx package.json package-lock.json
git commit -m "fix(credits): server-only credit writes; legacy pages charge via server actions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Direction concept (Claude) + mark rendering + R2 upload + font pick

**Files:**
- Create: `src/ai/studio/direction-concept.ts`, `src/ai/studio/render-mark.ts`, `src/lib/r2-server.ts`, `src/ai/studio/pick-font.ts`
- Test: `src/ai/studio/__tests__/direction-concept.test.ts`, `src/lib/__tests__/r2-server.test.ts`, `src/ai/studio/__tests__/pick-font.test.ts`

**Interfaces:**
- Consumes: `Recipe`, `IDEA_TYPE_GUIDANCE` (Task 3); `tagLabel` (Task 1); `jevEvaluate`, `JevQuestion` (Task 2); `withTimeout` (Task 2); `LOGO_MODELS`, `buildLogoModelInput`, `LogoProvider`; `BRAND_FONTS`; `r2`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` (`src/lib/r2.ts`); `ai` (`src/ai/genkit.ts`).
- Produces:
  - `interface DirectionBrief { name: string; pitch: string; audienceTags: string[]; styleTags: string[]; recipe: Recipe; feedbackChips?: string[]; seedIdea?: string }`
  - `DirectionConceptSchema` (zod) / `type DirectionConcept = { idea: string; rationale: string; markPrompt: string; captions: { mark: string; lockup: string; inUse: string } }`
  - `buildDirectionConceptPrompt(brief: DirectionBrief): string`
  - `generateDirectionConcept(brief: DirectionBrief): Promise<DirectionConcept>`
  - `renderMark(provider: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }>`
  - `extensionForContentType(contentType: string): string`; `uploadBufferToR2(buffer: Buffer, contentType: string, keyPrefix: string): Promise<string>`
  - `buildFontQuestion(): JevQuestion`; `pickFont(state: object): Promise<string>` (returns a `BRAND_FONTS` name; falls back to `'Archivo'`)

- [ ] **Step 1: Verify Jev's `choice` request shape with one real call** (the HTTP docs only show `boolean`):

```bash
KEY=$(grep '^AI_GATEWAY_API_KEY=' .env | cut -d= -f2-) && curl -s https://ai-gateway.vercel.sh/v1/evaluate -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"model":"typesafe-ai/jev","state":{"brand":"playful comedy podcast"},"questions":{"font":{"type":"choice","instructions":"Which font suits this brand?","criteria":{"Caprasimo":"cute, bold, rounded display","Aboreto":"formal, thin, all-caps"}}}}'
```
Expected: `{"answers":{"font":{"type":"choice","choice":"Caprasimo",...}}}`. If the field is not `criteria`, update `JevQuestion` in `src/ai/jev.ts` and the test below to match before continuing.

- [ ] **Step 2: Write failing tests**

`src/ai/studio/__tests__/direction-concept.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildDirectionConceptPrompt } from '../direction-concept';

const brief = {
  name: 'Broad City', pitch: 'A neighbourhood comedy podcast.',
  audienceTags: ['gen_z'], styleTags: ['playful', 'bold'],
  recipe: { ideaType: 'negative-space' as const, styleLean: 'playful', model: 'recraft' as const },
};

describe('buildDirectionConceptPrompt', () => {
  it('includes brand, tag labels, idea-type guidance and the style lean', () => {
    const p = buildDirectionConceptPrompt(brief);
    expect(p).toContain('Broad City');
    expect(p).toContain('A neighbourhood comedy podcast.');
    expect(p).toContain('Gen Z');
    expect(p).toContain('Playful, Bold');
    expect(p).toContain('second meaningful shape appears in the empty space');
    expect(p).toContain('Lean especially playful');
    expect(p).toContain('solid black mark on a plain white background');
  });
  it('adds feedback and seed idea when present', () => {
    const p = buildDirectionConceptPrompt({ ...brief, feedbackChips: ['less literal'], seedIdea: 'Two overlapping speech bubbles' });
    expect(p).toContain('Feedback on previous directions: less literal');
    expect(p).toContain('Explore a variation of this earlier direction: Two overlapping speech bubbles');
  });
});
```

`src/lib/__tests__/r2-server.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { extensionForContentType } from '../r2-server';

describe('extensionForContentType', () => {
  it.each([
    ['image/png', 'png'], ['image/webp', 'webp'], ['image/jpeg', 'jpg'],
    ['image/svg+xml', 'svg'], ['application/octet-stream', 'png'],
  ])('%s → %s', (ct, ext) => expect(extensionForContentType(ct)).toBe(ext));
});
```

`src/ai/studio/__tests__/pick-font.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildFontQuestion } from '../pick-font';
import { BRAND_FONTS } from '@/config/brand-fonts';

describe('buildFontQuestion', () => {
  it('offers every brand font as a choice', () => {
    const q = buildFontQuestion();
    expect(q.type).toBe('choice');
    if (q.type !== 'choice') return;
    expect(Object.keys(q.criteria).sort()).toEqual(BRAND_FONTS.map(f => f.name).sort());
  });
});
```

- [ ] **Step 3: Run to verify they fail** — `npx vitest run src/ai/studio src/lib/__tests__/r2-server.test.ts` → FAIL.

- [ ] **Step 4: Implement**

`src/ai/studio/direction-concept.ts`:
```ts
import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { tagLabel } from '@/lib/brand-tags';
import { withTimeout } from '@/lib/with-timeout';
import { IDEA_TYPE_GUIDANCE, type Recipe } from './recipes';

export interface DirectionBrief {
  name: string;
  pitch: string;
  audienceTags: string[];
  styleTags: string[];
  recipe: Recipe;
  feedbackChips?: string[];
  seedIdea?: string;
}

export const DirectionConceptSchema = z.object({
  idea: z.string().describe('The core idea of the mark in one short sentence (max 12 words).'),
  rationale: z.string().describe('Why it fits the brand, max 20 words.'),
  markPrompt: z.string().describe('Visual-only prompt for an image model: shapes, structure, line quality. No brand name, no text in the image.'),
  captions: z.object({
    mark: z.string().describe('Caption for the mark slide, 2-6 words.'),
    lockup: z.string().describe('Caption for the mark-with-name slide, 2-6 words.'),
    inUse: z.string().describe('Caption for the in-use slide, 2-6 words.'),
  }),
});
export type DirectionConcept = z.infer<typeof DirectionConceptSchema>;

export function buildDirectionConceptPrompt(b: DirectionBrief): string {
  const lines = [
    'You are a veteran brand designer creating ONE logo direction.',
    `Brand: ${b.name}`,
    `What it does: ${b.pitch}`,
    `Audience: ${b.audienceTags.map(tagLabel).join(', ') || 'general'}`,
    `Style: ${b.styleTags.map(tagLabel).join(', ') || 'Minimal'}`,
    `Idea type for this direction: ${IDEA_TYPE_GUIDANCE[b.recipe.ideaType]}`,
    `Lean especially ${tagLabel(b.recipe.styleLean).toLowerCase()}.`,
  ];
  if (b.feedbackChips?.length) lines.push(`Feedback on previous directions: ${b.feedbackChips.join(', ')}`);
  if (b.seedIdea) lines.push(`Explore a variation of this earlier direction: ${b.seedIdea}`);
  lines.push(
    'The mark must work as a solid black mark on a plain white background: flat, no gradients, no text, readable at small sizes.',
    'Keep every caption short and visual. No marketing fluff.'
  );
  return lines.join('\n');
}

export async function generateDirectionConcept(brief: DirectionBrief): Promise<DirectionConcept> {
  const res = await withTimeout(
    ai.generate({ prompt: buildDirectionConceptPrompt(brief), output: { schema: DirectionConceptSchema } }),
    45_000,
    'Concept generation'
  );
  if (!res.output) throw new Error('Concept generation returned no output');
  return res.output;
}
```

`src/lib/r2-server.ts`:
```ts
/** Server-side R2 upload of raw bytes (never import from client components). */
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from './r2';

export function extensionForContentType(contentType: string): string {
  if (contentType.includes('svg')) return 'svg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'png';
}

export async function uploadBufferToR2(buffer: Buffer, contentType: string, keyPrefix: string): Promise<string> {
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) throw new Error('R2 is not configured');
  const key = `${keyPrefix}/${randomUUID()}.${extensionForContentType(contentType)}`;
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: contentType }));
  return `${R2_PUBLIC_URL}/${key}`;
}
```

`src/ai/studio/render-mark.ts`:
```ts
import { fal } from '@fal-ai/client';
import { LOGO_MODELS, buildLogoModelInput, type LogoProvider } from '@/ai/logo-models';
import { withTimeout } from '@/lib/with-timeout';

export async function renderMark(provider: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY is not set');
  fal.config({ credentials: process.env.FAL_KEY.trim() });
  const result = await withTimeout(
    fal.subscribe(LOGO_MODELS[provider].endpointId, { input: buildLogoModelInput(provider, prompt) }),
    60_000,
    `${LOGO_MODELS[provider].label} render`
  );
  const url = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
  if (!url) throw new Error(`${LOGO_MODELS[provider].label} returned no image`);
  const res = await withTimeout(fetch(url), 30_000, 'Image download');
  if (!res.ok) throw new Error(`Image download failed (${res.status})`);
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') || 'image/png' };
}
```

`src/ai/studio/pick-font.ts`:
```ts
import { BRAND_FONTS } from '@/config/brand-fonts';
import { jevEvaluate, type JevQuestion } from '@/ai/jev';

export function buildFontQuestion(): JevQuestion {
  const criteria: Record<string, string> = {};
  for (const f of BRAND_FONTS) criteria[f.name] = `${f.category.toLowerCase()} display typeface`;
  return { type: 'choice', instructions: 'Which typeface best suits this brand name and logo direction?', criteria };
}

export async function pickFont(state: object): Promise<string> {
  try {
    const answers = await jevEvaluate(state, { font: buildFontQuestion() });
    const a = answers.font;
    if (a?.type === 'choice' && BRAND_FONTS.some(f => f.name === a.choice)) return a.choice;
  } catch (error) {
    console.error('[pick-font] Jev failed, using fallback font:', error);
  }
  return 'Archivo';
}
```

- [ ] **Step 5: Run to verify they pass** — `npx vitest run src/ai/studio src/lib/__tests__/r2-server.test.ts` → PASS. Then `npm run typecheck`.

- [ ] **Step 6: Commit**

```bash
git add src/ai/studio/direction-concept.ts src/ai/studio/render-mark.ts src/ai/studio/pick-font.ts src/lib/r2-server.ts src/ai/studio/__tests__ src/lib/__tests__/r2-server.test.ts
git commit -m "feat(studio): direction concept, mark rendering, server R2 upload, Jev font pick

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Round pipeline (background work with injected deps)

**Files:**
- Create: `src/ai/studio/run-round.ts`
- Test: `src/ai/studio/__tests__/run-round.emulator.test.ts`

**Interfaces:**
- Consumes: `ServerCredits` (Task 4), `DirectionBrief`, `DirectionConcept` (Task 6), `Recipe` (Task 3), `STUDIO_DIRECTION_REFUND`.
- Produces:
  - `interface RoundDeps { db: Firestore; credits: ServerCredits; generateConcept(b: DirectionBrief): Promise<DirectionConcept>; renderMark(p: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }>; uploadMark(buffer: Buffer, contentType: string, uid: string): Promise<string>; pickFont(state: object): Promise<string> }`
  - `interface RoundJob { uid: string; brandId: string; roundId: string; chargeKey: string; base: Omit<DirectionBrief, 'recipe'>; directions: { id: string; recipe: Recipe }[] }`
  - `runRound(deps: RoundDeps, job: RoundJob): Promise<void>`
- Direction doc after success: `{ status: 'ready', concept, markUrl, fontName, updatedAt }`; after failure: `{ status: 'failed', error, updatedAt }` and 5 credits refunded.

- [ ] **Step 1: Write the failing test** `src/ai/studio/__tests__/run-round.emulator.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createServerCredits } from '@/lib/server-credits';
import { INITIAL_CREDITS } from '@/lib/credits';
import { runRound, type RoundDeps } from '../run-round';
import type { Recipe } from '../recipes';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;
const recipes: Recipe[] = [
  { ideaType: 'lettermark', styleLean: 'bold', model: 'recraft' },
  { ideaType: 'negative-space', styleLean: 'playful', model: 'gpt-image' },
  { ideaType: 'literal-symbol', styleLean: 'bold', model: 'nano-banana' },
];

describe.skipIf(!ON)('runRound (emulator)', () => {
  let db: Firestore;
  beforeAll(() => {
    const app = getApps().find(a => a.name === 'round-test') ?? initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'round-test');
    db = getFirestore(app);
  });

  async function setup(failModel?: string) {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const credits = createServerCredits(db);
    await credits.charge({ uid, amount: 15, action: 'studioRound', key: 'round_x' });
    const base = `users/${uid}/brands/b/directions`;
    const directions = recipes.map((recipe, i) => ({ id: `d${i}`, recipe }));
    for (const d of directions) await db.doc(`${base}/${d.id}`).set({ roundId: 'r', recipe: d.recipe, status: 'pending' });
    const deps: RoundDeps = {
      db, credits,
      generateConcept: async b => ({ idea: `idea ${b.recipe.model}`, rationale: 'r', markPrompt: 'p', captions: { mark: 'm', lockup: 'l', inUse: 'u' } }),
      renderMark: async p => { if (p === failModel) throw new Error('Application not found'); return { buffer: Buffer.from('x'), contentType: 'image/png' }; },
      uploadMark: async () => 'https://r2.example/mark.png',
      pickFont: async () => 'Caprasimo',
    };
    await runRound(deps, { uid, brandId: 'b', roundId: 'r', chargeKey: 'round_x', base: { name: 'N', pitch: 'P', audienceTags: [], styleTags: [] }, directions });
    return { uid, base };
  }

  it('fills every direction when all models succeed', async () => {
    const { base, uid } = await setup();
    for (const i of [0, 1, 2]) {
      const d = (await db.doc(`${base}/d${i}`).get()).data()!;
      expect(d.status).toBe('ready');
      expect(d.markUrl).toBe('https://r2.example/mark.png');
      expect(d.fontName).toBe('Caprasimo');
      expect(d.concept.captions.mark).toBe('m');
    }
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS - 15);
  });

  it('fails only the broken direction and refunds its share', async () => {
    const { base, uid } = await setup('gpt-image');
    expect((await db.doc(`${base}/d0`).get()).data()?.status).toBe('ready');
    const failed = (await db.doc(`${base}/d1`).get()).data()!;
    expect(failed.status).toBe('failed');
    expect(failed.error).toContain('Application not found');
    expect((await db.doc(`${base}/d2`).get()).data()?.status).toBe('ready');
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS - 10);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npm run test:emulator` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/ai/studio/run-round.ts`:

```ts
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { LogoProvider } from '@/ai/logo-models';
import type { ServerCredits } from '@/lib/server-credits';
import { STUDIO_DIRECTION_REFUND } from '@/lib/credits';
import type { DirectionBrief, DirectionConcept } from './direction-concept';
import type { Recipe } from './recipes';

export interface RoundDeps {
  db: Firestore;
  credits: ServerCredits;
  generateConcept(brief: DirectionBrief): Promise<DirectionConcept>;
  renderMark(provider: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }>;
  uploadMark(buffer: Buffer, contentType: string, uid: string): Promise<string>;
  pickFont(state: object): Promise<string>;
}

export interface RoundJob {
  uid: string;
  brandId: string;
  roundId: string;
  chargeKey: string;
  base: Omit<DirectionBrief, 'recipe'>;
  directions: { id: string; recipe: Recipe }[];
}

async function runDirection(deps: RoundDeps, job: RoundJob, d: { id: string; recipe: Recipe }) {
  const ref = deps.db.doc(`users/${job.uid}/brands/${job.brandId}/directions/${d.id}`);
  try {
    await ref.update({ status: 'generating', updatedAt: FieldValue.serverTimestamp() });
    const concept = await deps.generateConcept({ ...job.base, recipe: d.recipe });
    await ref.update({ concept, updatedAt: FieldValue.serverTimestamp() });
    const [image, fontName] = await Promise.all([
      deps.renderMark(d.recipe.model, concept.markPrompt),
      deps.pickFont({ brandName: job.base.name, pitch: job.base.pitch, idea: concept.idea, style: d.recipe.styleLean }),
    ]);
    const markUrl = await deps.uploadMark(image.buffer, image.contentType, job.uid);
    await ref.update({ status: 'ready', markUrl, fontName, updatedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 300);
    console.error(`[studio] direction ${d.id} failed:`, error);
    await ref.update({ status: 'failed', error: message, updatedAt: FieldValue.serverTimestamp() }).catch(() => {});
    await deps.credits.refund({ uid: job.uid, key: job.chargeKey, amount: STUDIO_DIRECTION_REFUND, reason: 'direction failed' }).catch(console.error);
  }
}

export async function runRound(deps: RoundDeps, job: RoundJob): Promise<void> {
  await Promise.all(job.directions.map(d => runDirection(deps, job, d)));
}
```

- [ ] **Step 4: Run to verify it passes** — `npm run test:emulator` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/studio/run-round.ts src/ai/studio/__tests__/run-round.emulator.test.ts
git commit -m "feat(studio): round pipeline with per-direction failure isolation and refunds

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Studio server actions

**Files:**
- Create: `src/app/studio/actions.ts`, `src/features/studio/types.ts`

**Interfaces:**
- Consumes: everything above; `requireServerAuth`; `adminDb`.
- Produces (all return `{ success: boolean; data?: …; error?: string; insufficient?: boolean }`):
  - `suggestTags(idToken: string, name: string, pitch: string)` → `data: { audience: string[]; style: string[] }` (empty lists on Jev failure, still `success: true`)
  - `createStudioBrand(idToken: string, input: { name: string; pitch: string; audienceTags: string[]; styleTags: string[] })` → `data: { brandId: string }`
  - `startRound(idToken: string, brandId: string, clientRoundId: string, options?: { feedbackChips?: string[]; seedDirectionId?: string })` → `data: { roundId: string }`
  - `pickDirection(idToken: string, brandId: string, directionId: string)` → `data: { directionId: string }`
- Types (`src/features/studio/types.ts`): `StudioRound`, `StudioDirection`, `DirectionStatus`, `ROUND_FEEDBACK_CHIPS`.

- [ ] **Step 1: Create shared types** `src/features/studio/types.ts`:

```ts
import type { Recipe } from '@/ai/studio/recipes';
import type { DirectionConcept } from '@/ai/studio/direction-concept';
import type { FirestoreTimestamp } from '@/lib/types';

export type DirectionStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface StudioRound {
  id: string;
  createdAt: FirestoreTimestamp;
  feedbackChips: string[];
  seedDirectionId?: string | null;
}

export interface StudioDirection {
  id: string;
  roundId: string;
  order: number;
  recipe: Recipe;
  status: DirectionStatus;
  concept?: DirectionConcept;
  markUrl?: string;
  fontName?: string;
  error?: string;
  picked?: boolean;
  createdAt: FirestoreTimestamp;
}

export const ROUND_FEEDBACK_CHIPS = ['more playful', 'less literal', 'bolder', 'simpler'] as const;
```

- [ ] **Step 2: Create** `src/app/studio/actions.ts`:

```ts
'use server';

import { after } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/firebase/server';
import { requireServerAuth } from '@/lib/server-auth';
import { createServerCredits, InsufficientCreditsError } from '@/lib/server-credits';
import { CREDIT_COSTS } from '@/lib/credits';
import { isTagInGroup, tagLabel } from '@/lib/brand-tags';
import { buildTagQuestions, selectSuggestedTags } from '@/lib/tag-suggestions';
import { jevEvaluate } from '@/ai/jev';
import { pickRecipes } from '@/ai/studio/recipes';
import { generateDirectionConcept } from '@/ai/studio/direction-concept';
import { renderMark } from '@/ai/studio/render-mark';
import { pickFont } from '@/ai/studio/pick-font';
import { uploadBufferToR2 } from '@/lib/r2-server';
import { runRound } from '@/ai/studio/run-round';
import { ROUND_FEEDBACK_CHIPS } from '@/features/studio/types';

type Result<T> = { success: boolean; data?: T; error?: string; insufficient?: boolean };
const fail = (error: unknown): Result<never> => ({ success: false, error: error instanceof Error ? error.message : 'Something went wrong' });

export async function suggestTags(idToken: string, name: string, pitch: string): Promise<Result<{ audience: string[]; style: string[] }>> {
  try {
    await requireServerAuth(idToken);
    if (!name.trim() || pitch.trim().length < 5) return { success: true, data: { audience: [], style: [] } };
    try {
      const answers = await jevEvaluate({ brandName: name.trim(), whatItDoes: pitch.trim() }, buildTagQuestions());
      return { success: true, data: selectSuggestedTags(answers) };
    } catch (error) {
      console.error('[studio] tag suggestion failed:', error);
      return { success: true, data: { audience: [], style: [] } };
    }
  } catch (error) {
    return fail(error);
  }
}

const BrandInput = z.object({
  name: z.string().trim().min(1).max(60),
  pitch: z.string().trim().min(5).max(200),
  audienceTags: z.array(z.string()).min(1).max(5).refine(t => t.every(id => isTagInGroup('audience', id)), 'Unknown audience tag'),
  styleTags: z.array(z.string()).min(1).max(5).refine(t => t.every(id => isTagInGroup('style', id)), 'Unknown style tag'),
});

export async function createStudioBrand(idToken: string, input: z.infer<typeof BrandInput>): Promise<Result<{ brandId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    const parsed = BrandInput.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    const b = parsed.data;
    const ref = await adminDb.collection(`users/${uid}/brands`).add({
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
      source: 'studio',
      latestName: b.name,
      latestElevatorPitch: b.pitch,
      latestAudience: b.audienceTags.map(tagLabel).join(', '),
      latestDesirableCues: b.styleTags.map(tagLabel).join(', '),
      latestUndesirableCues: '',
      audienceTags: b.audienceTags,
      styleTags: b.styleTags,
    });
    return { success: true, data: { brandId: ref.id } };
  } catch (error) {
    return fail(error);
  }
}

const ID = /^[A-Za-z0-9_-]{8,64}$/;

export async function startRound(
  idToken: string,
  brandId: string,
  clientRoundId: string,
  options: { feedbackChips?: string[]; seedDirectionId?: string } = {}
): Promise<Result<{ roundId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(clientRoundId)) return { success: false, error: 'Invalid id' };
    const brandRef = adminDb.doc(`users/${uid}/brands/${brandId}`);
    const brandSnap = await brandRef.get();
    if (!brandSnap.exists) return { success: false, error: 'Brand not found' };
    const brand = brandSnap.data()!;

    const roundRef = brandRef.collection('rounds').doc(clientRoundId);
    if ((await roundRef.get()).exists) return { success: true, data: { roundId: clientRoundId } };

    const feedbackChips = (options.feedbackChips ?? []).filter(c => (ROUND_FEEDBACK_CHIPS as readonly string[]).includes(c));
    let seedIdea: string | undefined;
    if (options.seedDirectionId && ID.test(options.seedDirectionId)) {
      seedIdea = (await brandRef.collection('directions').doc(options.seedDirectionId).get()).data()?.concept?.idea;
    }

    const credits = createServerCredits(adminDb);
    const chargeKey = `round_${brandId}_${clientRoundId}`;
    try {
      await credits.charge({ uid, amount: CREDIT_COSTS.studioRound, action: 'studioRound', key: chargeKey });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) return { success: false, insufficient: true, error: `This needs ${error.needed} credits; you have ${error.balance}.` };
      throw error;
    }

    const recipes = pickRecipes(brand.styleTags ?? []);
    const batch = adminDb.batch();
    batch.create(roundRef, { createdAt: FieldValue.serverTimestamp(), feedbackChips, seedDirectionId: options.seedDirectionId ?? null });
    const directions = recipes.map((recipe, order) => {
      const ref = brandRef.collection('directions').doc();
      batch.create(ref, { roundId: clientRoundId, order, recipe, status: 'pending', picked: false, createdAt: FieldValue.serverTimestamp() });
      return { id: ref.id, recipe };
    });
    await batch.commit();

    after(() =>
      runRound(
        {
          db: adminDb,
          credits,
          generateConcept: generateDirectionConcept,
          renderMark,
          uploadMark: (buffer, contentType, owner) => uploadBufferToR2(buffer, contentType, `studio/${owner}`),
          pickFont,
        },
        {
          uid, brandId, roundId: clientRoundId, chargeKey,
          base: { name: brand.latestName, pitch: brand.latestElevatorPitch, audienceTags: brand.audienceTags ?? [], styleTags: brand.styleTags ?? [], feedbackChips, seedIdea },
          directions,
        }
      )
    );

    return { success: true, data: { roundId: clientRoundId } };
  } catch (error) {
    return fail(error);
  }
}

export async function pickDirection(idToken: string, brandId: string, directionId: string): Promise<Result<{ directionId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(directionId)) return { success: false, error: 'Invalid id' };
    const dirs = adminDb.collection(`users/${uid}/brands/${brandId}/directions`);
    const picked = await dirs.doc(directionId).get();
    if (!picked.exists) return { success: false, error: 'Direction not found' };
    const siblings = await dirs.where('roundId', '==', picked.data()!.roundId).get();
    const batch = adminDb.batch();
    siblings.docs.forEach(d => batch.update(d.ref, { picked: d.id === directionId, pickedAt: d.id === directionId ? FieldValue.serverTimestamp() : null }));
    batch.create(adminDb.collection('events').doc(), { type: 'picked', uid, brandId, directionId, recipe: picked.data()!.recipe, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return { success: true, data: { directionId } };
  } catch (error) {
    return fail(error);
  }
}
```

- [ ] **Step 3: Verify** — `npm run typecheck && npm run lint && npm test` → pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/studio/actions.ts src/features/studio/types.ts
git commit -m "feat(studio): server actions for tags, brand creation, rounds and picking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Start screen (`/studio/new`)

**Files:**
- Create: `src/app/studio/new/page.tsx`, `src/app/studio/new/start-client.tsx`, `src/features/studio/components/tag-picker.tsx`

**Interfaces:**
- Consumes: `suggestTags`, `createStudioBrand`, `startRound` (Task 8); `AUDIENCE_TAGS`, `STYLE_TAGS` (Task 1); `useRequireAuth`.
- Produces: `TagPicker({ tags: readonly BrandTag[]; selected: string[]; onChange(next: string[]): void; max?: number; label: string })`.

- [ ] **Step 1: TagPicker** `src/features/studio/components/tag-picker.tsx`:

```tsx
'use client';

import type { BrandTag } from '@/lib/brand-tags';
import { cn } from '@/lib/utils';

export function TagPicker({ tags, selected, onChange, max = 5, label }: {
  tags: readonly BrandTag[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label: string;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else if (selected.length < max) onChange([...selected, id]);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label} <span className="text-muted-foreground font-normal">· up to {max}</span></legend>
      <div className="flex flex-wrap gap-2">
        {tags.map(t => {
          const on = selected.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(t.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                on ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 2: Page + client**

`src/app/studio/new/page.tsx`:
```tsx
import { StartClient } from './start-client';

export const metadata = { title: 'New brand' };

export default function StudioNewPage() {
  return <StartClient />;
}
```

`src/app/studio/new/start-client.tsx`:
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUDIENCE_TAGS, STYLE_TAGS } from '@/lib/brand-tags';
import { TagPicker } from '@/features/studio/components/tag-picker';
import { suggestTags, createStudioBrand, startRound } from '@/app/studio/actions';
import { CREDIT_COSTS } from '@/lib/credits';

export function StartClient() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [audience, setAudience] = useState<string[]>([]);
  const [style, setStyle] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (!user || touched.current || !name.trim() || pitch.trim().length < 5) return;
    const t = setTimeout(async () => {
      setIsSuggesting(true);
      const res = await suggestTags(await user.getIdToken(), name, pitch);
      if (res.success && res.data && !touched.current) {
        setAudience(res.data.audience);
        setStyle(res.data.style);
      }
      setIsSuggesting(false);
    }, 700);
    return () => clearTimeout(t);
  }, [user, name, pitch]);

  const canStart = name.trim() && pitch.trim().length >= 5 && audience.length > 0 && style.length > 0 && !isStarting;

  const handleStart = async () => {
    if (!user || !canStart) return;
    setIsStarting(true);
    setError(null);
    const token = await user.getIdToken();
    const brand = await createStudioBrand(token, { name, pitch, audienceTags: audience, styleTags: style });
    if (!brand.success || !brand.data) { setError(brand.error ?? 'Could not create brand'); setIsStarting(false); return; }
    const round = await startRound(token, brand.data.brandId, crypto.randomUUID().replace(/-/g, ''));
    if (!round.success) setError(round.error ?? 'Could not start');
    router.push(`/studio/${brand.data.brandId}`);
  };

  if (isLoading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 pb-16 pt-24">
      <div className="space-y-3">
        <Input aria-label="Brand name" placeholder="Brand name" value={name} onChange={e => setName(e.target.value)} className="h-12 text-lg" maxLength={60} />
        <Input aria-label="What it does" placeholder="What does it do, in one sentence?" value={pitch} onChange={e => setPitch(e.target.value)} className="h-12" maxLength={200} />
      </div>
      <div className="space-y-6" onClickCapture={() => { touched.current = true; }}>
        {isSuggesting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Suggesting tags…</p>}
        <TagPicker label="Who is it for?" tags={AUDIENCE_TAGS} selected={audience} onChange={setAudience} />
        <TagPicker label="How should it feel?" tags={STYLE_TAGS} selected={style} onChange={setStyle} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="lg" className="w-full" onClick={handleStart} disabled={!canStart}>
        {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Show me 3 directions · ${CREDIT_COSTS.studioRound} credits`}
      </Button>
    </main>
  );
}
```

- [ ] **Step 3: Verify** — `npm run typecheck && npm run lint`. Manual (emulators + `dev:local` on :3001, signed in as the test user): open `/studio/new`, type a name and sentence, confirm tags get pre-selected within ~2s, toggle a tag, press the button → navigates to `/studio/<id>` (404 until Task 10 — expected).

- [ ] **Step 4: Commit**

```bash
git add src/app/studio/new src/features/studio/components/tag-picker.tsx
git commit -m "feat(studio): start screen with Jev-suggested preset tags

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Studio page — rounds, rows, slides

**Files:**
- Create: `src/app/studio/[brandId]/page.tsx`, `src/app/studio/[brandId]/studio-client.tsx`, `src/features/studio/hooks/use-studio-data.ts`, `src/features/studio/components/{round-block,direction-row,slide-frame}.tsx`, `src/features/studio/components/slides/{mark-slide,lockup-slide,in-use-slide,typography-slide}.tsx`
- Modify: `src/app/dashboard/dashboard-client.tsx` (entry button)

**Interfaces:**
- Consumes: `StudioRound`, `StudioDirection`, `ROUND_FEEDBACK_CHIPS` (Task 8); `startRound`, `pickDirection`; `BRAND_FONTS`; `createStickerEffect`; Firebase hooks (`useUser`, `useFirestore`, `useDoc`, `useCollection`, `useMemoFirebase`).
- Produces: `useStudioData(brandId: string)` → `{ brand: (Brand & { styleTags?: string[] }) | null; rounds: { round: StudioRound; directions: StudioDirection[] }[]; isLoading: boolean }`; `SlideFrame({ caption?: string; status: 'loading' | 'ready' | 'failed'; children?: ReactNode; className?: string })`.

- [ ] **Step 1: Data hook** `src/features/studio/hooks/use-studio-data.ts`:

```ts
'use client';

import { useMemo } from 'react';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Brand } from '@/lib/types';
import type { StudioDirection, StudioRound } from '../types';

export function useStudioData(brandId: string) {
  const { user } = useUser();
  const db = useFirestore();
  const base = user ? `users/${user.uid}/brands/${brandId}` : null;

  const brandRef = useMemoFirebase(() => (base ? doc(db, base) : null), [db, base]);
  const roundsQ = useMemoFirebase(() => (base ? query(collection(db, `${base}/rounds`), orderBy('createdAt', 'desc')) : null), [db, base]);
  const dirsQ = useMemoFirebase(() => (base ? query(collection(db, `${base}/directions`), orderBy('createdAt', 'asc')) : null), [db, base]);

  const { data: brand, isLoading: l1 } = useDoc<Brand & { styleTags?: string[] }>(brandRef);
  const { data: rounds, isLoading: l2 } = useCollection<StudioRound>(roundsQ);
  const { data: directions, isLoading: l3 } = useCollection<StudioDirection>(dirsQ);

  const grouped = useMemo(
    () => (rounds ?? []).map(round => ({
      round,
      directions: (directions ?? []).filter(d => d.roundId === round.id).sort((a, b) => a.order - b.order),
    })),
    [rounds, directions]
  );

  return { brand: brand ?? null, rounds: grouped, isLoading: l1 || l2 || l3 };
}
```

- [ ] **Step 2: Slide frame** `src/features/studio/components/slide-frame.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SlideFrame({ caption, status, children, className }: {
  caption?: string;
  status: 'loading' | 'ready' | 'failed';
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure className="w-[320px] shrink-0 space-y-2">
      <div
        style={{ containerType: 'inline-size' }}
        className={cn(
          'relative aspect-video overflow-hidden rounded-xl border bg-white',
          status === 'loading' && 'animate-pulse bg-muted',
          className
        )}
      >
        {status !== 'loading' && children}
      </div>
      {caption && status === 'ready' && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
```

- [ ] **Step 3: Slides**

`slides/mark-slide.tsx`:
```tsx
/* eslint-disable @next/next/no-img-element */
export function MarkSlide({ markUrl }: { markUrl: string }) {
  return <img src={markUrl} alt="Logo mark" className="absolute inset-0 m-auto h-[70%] w-auto object-contain" />;
}
```

`slides/lockup-slide.tsx`:
```tsx
/* eslint-disable @next/next/no-img-element */
import { BRAND_FONTS } from '@/config/brand-fonts';

export function LockupSlide({ markUrl, name, fontName }: { markUrl: string; name: string; fontName?: string }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[4cqw] px-[8cqw]">
      <img src={markUrl} alt="" className="h-[28cqw] w-auto object-contain" />
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: `${9 * font.sizeMultiplier}cqw` }} className="leading-none">
        {name}
      </span>
    </div>
  );
}
```

`slides/in-use-slide.tsx`:
```tsx
'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { createStickerEffect } from '@/lib/sticker-effect';

export function InUseSlide({ markUrl }: { markUrl: string }) {
  const [sticker, setSticker] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    createStickerEffect(markUrl).then(s => { if (alive) setSticker(s); });
    return () => { alive = false; };
  }, [markUrl]);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[8cqw] bg-neutral-100">
      <div className="flex h-[30cqw] w-[30cqw] items-center justify-center rounded-[22%] bg-black">
        <img src={markUrl} alt="" className="h-[60%] w-auto object-contain invert" />
      </div>
      {sticker && <img src={sticker} alt="" className="h-[34cqw] w-auto -rotate-6 object-contain drop-shadow-md" />}
    </div>
  );
}
```

`slides/typography-slide.tsx`:
```tsx
import { BRAND_FONTS } from '@/config/brand-fonts';

export function TypographySlide({ name, fontName }: { name: string; fontName?: string }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[2cqw] px-[8cqw]">
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: '16cqw' }} className="leading-none">Aa</span>
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: '5cqw' }} className="leading-tight">{name}</span>
      <span style={{ fontSize: '2.6cqw' }} className="font-sans text-muted-foreground">{font.name} · Geist Sans</span>
    </div>
  );
}
```

- [ ] **Step 4: Direction row** `src/features/studio/components/direction-row.tsx`:

```tsx
'use client';

import { Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlideFrame } from './slide-frame';
import { MarkSlide } from './slides/mark-slide';
import { LockupSlide } from './slides/lockup-slide';
import { InUseSlide } from './slides/in-use-slide';
import { TypographySlide } from './slides/typography-slide';
import type { StudioDirection } from '../types';

export function DirectionRow({ direction, brandName, collapsed, onPick, onVariations }: {
  direction: StudioDirection;
  brandName: string;
  collapsed: boolean;
  onPick: () => void;
  onVariations: () => void;
}) {
  const { status, concept, markUrl, fontName, picked } = direction;
  const ready = status === 'ready' && !!markUrl;
  const frame = status === 'failed' ? 'failed' : ready ? 'ready' : 'loading';

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" /> This direction couldn&apos;t be generated; its credits were refunded.
      </div>
    );
  }

  return (
    <section className={cn('space-y-3 transition-opacity', collapsed && 'opacity-50 hover:opacity-100')}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">{concept?.idea ?? 'Thinking…'}</p>
        {ready && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={onVariations}>More like this</Button>
            <Button size="sm" variant={picked ? 'default' : 'outline'} onClick={onPick}>
              {picked ? <><Check className="mr-1 h-3 w-3" />Picked</> : 'Pick this'}
            </Button>
          </div>
        )}
      </div>
      <div className={cn('flex gap-4 overflow-x-auto pb-2', collapsed && 'max-h-24 overflow-hidden')}>
        <SlideFrame status={frame} caption={concept?.captions.mark}>{markUrl && <MarkSlide markUrl={markUrl} />}</SlideFrame>
        <SlideFrame status={frame} caption={concept?.captions.lockup}>{markUrl && <LockupSlide markUrl={markUrl} name={brandName} fontName={fontName} />}</SlideFrame>
        <SlideFrame status={frame} caption={concept?.captions.inUse}>{markUrl && <InUseSlide markUrl={markUrl} />}</SlideFrame>
        <SlideFrame status={frame} caption="Typography">{markUrl && <TypographySlide name={brandName} fontName={fontName} />}</SlideFrame>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Round block** `src/features/studio/components/round-block.tsx`:

```tsx
'use client';

import { DirectionRow } from './direction-row';
import type { StudioDirection, StudioRound } from '../types';

export function RoundBlock({ round, directions, brandName, index, onPick, onVariations }: {
  round: StudioRound;
  directions: StudioDirection[];
  brandName: string;
  index: number;
  onPick: (directionId: string) => void;
  onVariations: (directionId: string) => void;
}) {
  const pickedId = directions.find(d => d.picked)?.id;
  return (
    <div className="space-y-8 border-b pb-10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Round {index}{round.feedbackChips?.length ? ` · ${round.feedbackChips.join(', ')}` : ''}
      </p>
      {directions.map(d => (
        <DirectionRow
          key={d.id}
          direction={d}
          brandName={brandName}
          collapsed={!!pickedId && pickedId !== d.id}
          onPick={() => onPick(d.id)}
          onVariations={() => onVariations(d.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Page + client**

`src/app/studio/[brandId]/page.tsx`:
```tsx
import { StudioClient } from './studio-client';

export const maxDuration = 300;
export const metadata = { title: 'Studio' };

export default async function StudioPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  return <StudioClient brandId={brandId} />;
}
```

`src/app/studio/[brandId]/studio-client.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useStudioData } from '@/features/studio/hooks/use-studio-data';
import { RoundBlock } from '@/features/studio/components/round-block';
import { ROUND_FEEDBACK_CHIPS } from '@/features/studio/types';
import { startRound, pickDirection } from '@/app/studio/actions';
import { CREDIT_COSTS } from '@/lib/credits';
import { cn } from '@/lib/utils';

export function StudioClient({ brandId }: { brandId: string }) {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { brand, rounds, isLoading } = useStudioData(brandId);
  const { toast } = useToast();
  const [chips, setChips] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const newRound = async (seedDirectionId?: string) => {
    if (!user || isStarting) return;
    setIsStarting(true);
    const res = await startRound(await user.getIdToken(), brandId, crypto.randomUUID().replace(/-/g, ''), { feedbackChips: chips, seedDirectionId });
    if (!res.success) toast({ variant: 'destructive', title: 'Could not start a new round', description: res.error });
    else setChips([]);
    setIsStarting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pick = async (directionId: string) => {
    if (!user) return;
    const res = await pickDirection(await user.getIdToken(), brandId, directionId);
    if (!res.success) toast({ variant: 'destructive', title: 'Could not pick', description: res.error });
  };

  if (authLoading || isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!brand) return <p className="pt-24 text-center text-muted-foreground">Brand not found</p>;

  return (
    <main className="mx-auto max-w-[1400px] space-y-10 px-6 pb-24 pt-24">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{brand.latestName}</h1>
          <p className="text-sm text-muted-foreground">{brand.latestElevatorPitch}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ROUND_FEEDBACK_CHIPS.map(c => (
            <button
              key={c}
              type="button"
              aria-pressed={chips.includes(c)}
              onClick={() => setChips(cs => (cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]))}
              className={cn('rounded-full border px-3 py-1 text-xs', chips.includes(c) ? 'border-foreground bg-foreground text-background' : 'hover:border-foreground/40')}
            >
              {c}
            </button>
          ))}
          <Button onClick={() => newRound()} disabled={isStarting}>
            {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : `New directions · ${CREDIT_COSTS.studioRound}`}
          </Button>
        </div>
      </header>
      {rounds.length === 0 && <p className="text-muted-foreground">No directions yet. Press “New directions” to start.</p>}
      {rounds.map(({ round, directions }, i) => (
        <RoundBlock
          key={round.id}
          round={round}
          directions={directions}
          brandName={brand.latestName}
          index={rounds.length - i}
          onPick={pick}
          onVariations={id => newRound(id)}
        />
      ))}
    </main>
  );
}
```

- [ ] **Step 7: Dashboard entry point** — in `src/app/dashboard/dashboard-client.tsx`, next to the existing "Create New Brand" button, add:

```tsx
<Button asChild variant="default">
  <Link href="/studio/new">New brand in Studio</Link>
</Button>
```
(import `Link` from `next/link` if not already imported).

- [ ] **Step 8: Verify** — `npm run typecheck && npm run lint && npm test`. Then manual E2E on `localhost:3001` with emulators, signed in as the test user:
  1. `/studio/new` → name + sentence → tags pre-selected → "Show me 3 directions".
  2. `/studio/<id>` shows 3 rows of pulsing frames; within ~15s the first row's mark and free slides appear; all three rows fill (or one shows the refunded failure message).
  3. Balance in the header drops by 15 (plus 5 back per failed direction).
  4. "Pick this" → the other two rows dim; reload keeps the pick.
  5. Select "bolder" → "New directions" → a new round appears on top, older below.
  6. "More like this" on a row → new round seeded from that idea.
  7. Double-click "New directions" quickly → only one new round and one 15-credit charge.

- [ ] **Step 9: Commit**

```bash
git add "src/app/studio/[brandId]" src/features/studio src/app/dashboard/dashboard-client.tsx
git commit -m "feat(studio): rounds page with progressive direction rows and free slides

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Docs

**Files:**
- Modify: `claude.md` (add a "Studio" section; fix env var list)
- Modify: `docs/SPEC.md` ("Fixed during this session" + note P0-1 credits now server-side for Studio and legacy pages)

- [ ] **Step 1: Add to `claude.md`** a section:

```markdown
## Studio (new brand flow)

Routes: `/studio/new` (name + one sentence + Jev-suggested preset tags) → `/studio/[brandId]` (rounds of 3 directions as rows).
Server actions: `src/app/studio/actions.ts` (`suggestTags`, `createStudioBrand`, `startRound`, `pickDirection`). Background work runs in `after()` via `src/ai/studio/run-round.ts`.
Data: `users/{uid}/brands/{brandId}/{rounds,directions}` (server-written only), `events` (server-only).
Credits: server-only via `src/lib/server-credits.ts` (idempotent charge keys, refunds). Round = 15, failed direction refunds 5.
Models: `src/ai/logo-models.ts` (Recraft V4.1, GPT Image 1.5, Nano Banana Pro). Jev (`typesafe-ai/jev`) via `AI_GATEWAY_API_KEY` for tag suggestions and font choice.
Local: `npm run emulators` (needs Java) + `npm run dev:local`; emulator tests `npm run test:emulator`.
```

and in the env var list add `ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`, `R2_PUBLIC_URL`, `FIREBASE_SERVICE_ACCOUNT_KEY`; remove `GOOGLE_GENAI_API_KEY` and `OPENAI_API_KEY`.

- [ ] **Step 2: Commit**

```bash
git add claude.md docs/SPEC.md
git commit -m "docs: document Studio flow, server credits, and env vars

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
