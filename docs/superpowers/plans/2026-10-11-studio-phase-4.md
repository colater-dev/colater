# Studio Phase 4 Implementation Plan — more slides, slide feedback, progress

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each direction row gains dashed placeholder slides the user can generate (Color, Voice, Vector; Mockups free once Color exists), every slide gets a hover feedback popover that regenerates just that slide, failed directions get a Retry, and rows show what they're doing while they load.

**Architecture:** A new server action `generateSlide` charges (idempotent key), marks the slide `pending` on the direction doc, records feedback/events, and schedules `runSlide` in `after()`. `runSlide` (deps injected, emulator-tested) produces a palette or voice via Claude, a vector via fal, a re-rendered mark, or a new font via Jev, then writes the result or fails + refunds. Color is a Claude palette applied to the black mark **deterministically in the browser** (canvas recolor), so the mark's shape never changes. The sweep also fails/refunds slides stuck >10 min.

**Tech Stack:** Next.js 16 server actions + `after()`, Firebase Admin/emulator, Genkit + Claude Sonnet 4.5, fal (`fal-ai/recraft/vectorize`), Jev via Vercel AI Gateway, Radix Popover (`src/components/ui/popover.tsx`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-11-studio-brand-flow-design.md` (§4 slides + feedback chips, §6 credits, §7 errors). Builds on `docs/superpowers/plans/2026-10-11-studio-phases-1-3.md` (merged to `main`).

## Spec deviation (needs owner OK before execution)

Spec §4 says Color = "fal recolor + palette extraction". The fal model the old flow used (`fal-ai/reve/fast/remix`) no longer exists. This plan instead has **Claude generate a 5-color palette** and **recolors the black mark exactly in the browser**. Cheaper, instant, and the shape stays identical (matches the owner's todo: "as close to the current one… like a designer may create color and black and white versions").

## Global Constraints

- Work on branch `studio-phase-4` off `main`; commit after each task; end commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never commit `.env`, `.claude/`.
- Credits (add to `CREDIT_COSTS`): `studioColor: 5`, `studioVoice: 2`, `studioVector: 5`, `studioMarkRedo: 5`. Lockup font change, mockups, typography: **free**.
- A failed paid slide refunds its full cost. Charges are idempotent by `slide_${directionId}_${clientRequestId}`.
- Slide feedback chips exactly (spec §4): mark: *simpler · bolder · less literal · different shape · thinner lines*; lockup: *different font · tighter · name larger*; color: *warmer · cooler · more muted · more vivid*; voice: *shorter · more playful · more serious*. Optional note ≤ 200 chars.
- Captions ≤ 12 words. Slides 16:9, sized with container units (`containerType: 'inline-size'` + `cqw`).
- Timeouts: Claude 45s, fal 60s, Jev 10s. Stale slide/direction = 10 min (`STALE_DIRECTION_MS`).
- Checks: `npm run typecheck && npm run lint && npm test`; emulator tests `npm run test:emulator` (emulators: `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" npm run emulators`).

## Review Focus

- **Generate clicked twice / re-render** → one charge, one job. Pinned by Task 5 emulator test "same request id charges once and schedules once".
- **Vector/Color/Voice provider fails** → slide shows failed with Retry and the full cost is refunded; other slides untouched. Pinned by Task 4 emulator test "failed vector refunds its cost".
- **Mark regenerated after Vector exists** → the old SVG no longer matches; vector slide resets to a placeholder. Pinned by Task 4 emulator test "mark redo clears vector".
- **Slide job killed mid-flight** (`after()` on serverless) → slide fails + refunds after 10 min. Pinned by Task 6 emulator test.
- **Not enough credits for a paid slide** → nothing charged or written; placeholder shows the shortfall with a credits link. Pinned by Task 5 test "insufficient credits writes nothing".

---

## File Structure

```
src/features/studio/types.ts                      + slide/feedback/palette types, chips, stage
src/lib/credits.ts                                + studioColor/Voice/Vector/MarkRedo
src/features/studio/stage-label.ts                pure: direction → status text
src/lib/recolor.ts                                pure: recolor black-on-white pixels → colored + alpha
src/features/studio/hooks/use-recolored-mark.ts   browser: markUrl + hex → data URL
src/ai/studio/palette.ts                          prompt builder (pure) + Claude palette
src/ai/studio/voice.ts                            prompt builder (pure) + Claude tagline/story
src/ai/studio/vectorize-mark.ts                   fal recraft/vectorize → SVG bytes
src/ai/studio/run-slide.ts                        slide pipeline (deps injected)
src/ai/studio/run-round.ts                        + writes `stage`
src/ai/studio/sweep-stale.ts                      + stale slides
src/ai/studio/pick-font.ts                        + exclude option
src/app/studio/actions.ts                         + generateSlide
src/features/studio/components/slide-placeholder.tsx
src/features/studio/components/slide-feedback.tsx
src/features/studio/components/slides/{color,business-card,social,voice,vector,sticker,app-icon}-slide.tsx (in-use-slide removed)
src/features/studio/components/direction-row.tsx  rewired
src/features/studio/hooks/use-slide-request.ts    per-intent request ids + call generateSlide
```

---

### Task 0: Branch

- [ ] **Step 1:** `git checkout -b studio-phase-4` (from `main`). Verify `git status` shows only untracked `.claude/`.

---

### Task 1: Types, costs, and row status text

**Files:**
- Modify: `src/features/studio/types.ts`, `src/lib/credits.ts`, `src/ai/studio/run-round.ts`
- Create: `src/features/studio/stage-label.ts`
- Test: `src/features/studio/__tests__/stage-label.test.ts`, extend `src/ai/studio/__tests__/run-round.emulator.test.ts`

**Interfaces:**
- Produces (types.ts):
  - `type DirectionStage = 'concept' | 'mark'`
  - `type PaidSlideKind = 'color' | 'voice' | 'vector'`; `type FeedbackSlideKind = 'mark' | 'lockup' | 'color' | 'voice'`; `type GenerateKind = PaidSlideKind | 'mark' | 'lockup'`
  - `interface PaletteColor { hex: string; name: string; role: 'primary' | 'secondary' | 'accent' | 'background' | 'ink' }`
  - `interface SlideState { status: 'pending' | 'ready' | 'failed'; error?: string; requestedAt?: FirestoreTimestamp; chargeKey?: string; cost?: number }`
  - `interface DirectionSlides { color?: SlideState & { palette?: PaletteColor[] }; voice?: SlideState & { tagline?: string; story?: string }; vector?: SlideState & { svgUrl?: string } }`
  - `StudioDirection` gains `stage?: DirectionStage; slides?: DirectionSlides; chargeKey?: string`
  - `SLIDE_FEEDBACK_CHIPS: Record<FeedbackSlideKind, readonly string[]>`
  - `GENERATE_COSTS: Record<GenerateKind, number>` (color 5, voice 2, vector 5, mark 5, lockup 0) — derived from `CREDIT_COSTS`.
- Produces: `stageLabel(d: Pick<StudioDirection, 'status' | 'stage' | 'recipe'>): string | null`

- [ ] **Step 1: Costs** — in `src/lib/credits.ts` add to `CREDIT_COSTS`: `studioColor: 5, studioVoice: 2, studioVector: 5, studioMarkRedo: 5,` and to `CREDIT_ACTION_LABELS`: `studioColor: 'Studio color palette', studioVoice: 'Studio voice', studioVector: 'Studio vector file', studioMarkRedo: 'Studio mark redo',`.

- [ ] **Step 2: Types** — append to `src/features/studio/types.ts`:

```ts
import { CREDIT_COSTS } from '@/lib/credits';

export type DirectionStage = 'concept' | 'mark';
export type PaidSlideKind = 'color' | 'voice' | 'vector';
export type FeedbackSlideKind = 'mark' | 'lockup' | 'color' | 'voice';
export type GenerateKind = PaidSlideKind | 'mark' | 'lockup';

export interface PaletteColor {
  hex: string;
  name: string;
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'ink';
}

export interface SlideState {
  status: 'pending' | 'ready' | 'failed';
  error?: string;
  requestedAt?: FirestoreTimestamp;
  chargeKey?: string;
  cost?: number;
}

export interface DirectionSlides {
  color?: SlideState & { palette?: PaletteColor[] };
  voice?: SlideState & { tagline?: string; story?: string };
  vector?: SlideState & { svgUrl?: string };
}

export const SLIDE_FEEDBACK_CHIPS: Record<FeedbackSlideKind, readonly string[]> = {
  mark: ['simpler', 'bolder', 'less literal', 'different shape', 'thinner lines'],
  lockup: ['different font', 'tighter', 'name larger'],
  color: ['warmer', 'cooler', 'more muted', 'more vivid'],
  voice: ['shorter', 'more playful', 'more serious'],
};

export const GENERATE_COSTS: Record<GenerateKind, number> = {
  color: CREDIT_COSTS.studioColor,
  voice: CREDIT_COSTS.studioVoice,
  vector: CREDIT_COSTS.studioVector,
  mark: CREDIT_COSTS.studioMarkRedo,
  lockup: 0,
};
```

and add `stage?: DirectionStage; slides?: DirectionSlides; chargeKey?: string;` to `interface StudioDirection`.

- [ ] **Step 3: Failing test** `src/features/studio/__tests__/stage-label.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { stageLabel } from '../stage-label';

const recipe = { ideaType: 'lettermark' as const, styleLean: 'bold', model: 'gpt-image' as const };

describe('stageLabel', () => {
  it('describes each in-progress step with the model name', () => {
    expect(stageLabel({ status: 'pending', recipe })).toBe('Starting…');
    expect(stageLabel({ status: 'generating', stage: 'concept', recipe })).toBe('Writing the idea…');
    expect(stageLabel({ status: 'generating', stage: 'mark', recipe })).toBe('Drawing the mark with GPT Image 1.5…');
  });
  it('returns null once ready or failed', () => {
    expect(stageLabel({ status: 'ready', stage: 'mark', recipe })).toBeNull();
    expect(stageLabel({ status: 'failed', recipe })).toBeNull();
  });
});
```

- [ ] **Step 4: Run** `npx vitest run src/features/studio` → FAIL (module missing).

- [ ] **Step 5: Implement** `src/features/studio/stage-label.ts`:

```ts
import { LOGO_MODELS } from '@/ai/logo-models';
import type { StudioDirection } from './types';

export function stageLabel(d: Pick<StudioDirection, 'status' | 'stage' | 'recipe'>): string | null {
  if (d.status === 'ready' || d.status === 'failed') return null;
  if (d.status === 'pending' || !d.stage) return 'Starting…';
  if (d.stage === 'concept') return 'Writing the idea…';
  return `Drawing the mark with ${LOGO_MODELS[d.recipe.model].label}…`;
}
```

- [ ] **Step 6: Write stages in `run-round.ts`** — in `runDirection`, change the first update to `{ status: 'generating', stage: 'concept', updatedAt: … }` and the post-concept update to `{ concept, stage: 'mark', updatedAt: … }`. Extend the existing "fills every direction" emulator test with `expect(d.stage).toBe('mark');` inside the loop.

- [ ] **Step 7: Run** `npx vitest run src/features/studio` → PASS; `npm run test:emulator` → PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/studio/types.ts src/lib/credits.ts src/features/studio/stage-label.ts src/features/studio/__tests__/stage-label.test.ts src/ai/studio/run-round.ts src/ai/studio/__tests__/run-round.emulator.test.ts
git commit -m "feat(studio): slide types, phase-4 costs, and row progress stages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Deterministic mark recolor

**Files:**
- Create: `src/lib/recolor.ts`, `src/features/studio/hooks/use-recolored-mark.ts`
- Test: `src/lib/__tests__/recolor.test.ts`

**Interfaces:**
- Consumes: `hexToRgb` (`src/lib/color-utils.ts`), `getProxyUrl` (`src/lib/image-utils.ts`).
- Produces: `recolorPixels(data: Uint8ClampedArray, ink: { r: number; g: number; b: number }): void` (in place: dark → ink color opaque, white → transparent, anti-aliased edges → partial alpha); `useRecoloredMark(markUrl: string | undefined, hex: string | undefined): string | null` (PNG data URL with transparent background).

- [ ] **Step 1: Failing test** `src/lib/__tests__/recolor.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { recolorPixels } from '../recolor';

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba);

describe('recolorPixels', () => {
  const ink = { r: 200, g: 40, b: 10 };
  it('turns black into the ink color, fully opaque', () => {
    const d = px(0, 0, 0, 255);
    recolorPixels(d, ink);
    expect([...d]).toEqual([200, 40, 10, 255]);
  });
  it('turns white into transparent', () => {
    const d = px(255, 255, 255, 255);
    recolorPixels(d, ink);
    expect(d[3]).toBe(0);
  });
  it('keeps anti-aliased edges as partial alpha', () => {
    const d = px(128, 128, 128, 255);
    recolorPixels(d, ink);
    expect(d[3]).toBeGreaterThan(100);
    expect(d[3]).toBeLessThan(155);
    expect([d[0], d[1], d[2]]).toEqual([200, 40, 10]);
  });
  it('treats near-white paper noise as fully transparent', () => {
    const d = px(250, 251, 249, 255);
    recolorPixels(d, ink);
    expect(d[3]).toBe(0);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/__tests__/recolor.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/lib/recolor.ts`:

```ts
/** Recolors a black-on-white mark in place: ink where dark, transparent where white. */
export function recolorPixels(data: Uint8ClampedArray, ink: { r: number; g: number; b: number }): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Map luminance 245..0 → alpha 0..255 (anything lighter than 245 is paper).
    const alpha = lum >= 245 ? 0 : Math.round(((245 - lum) / 245) * 255);
    data[i] = ink.r;
    data[i + 1] = ink.g;
    data[i + 2] = ink.b;
    data[i + 3] = Math.round((alpha * data[i + 3]) / 255);
  }
}
```

- [ ] **Step 4: Run** → PASS (4 tests).

- [ ] **Step 5: Hook** `src/features/studio/hooks/use-recolored-mark.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';
import { hexToRgb } from '@/lib/color-utils';
import { getProxyUrl } from '@/lib/image-utils';
import { recolorPixels } from '@/lib/recolor';

export function useRecoloredMark(markUrl: string | undefined, hex: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const ink = hex ? hexToRgb(hex) : null;
    if (!markUrl || !ink) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      recolorPixels(data.data, ink);
      ctx.putImageData(data, 0, 0);
      if (alive) setUrl(canvas.toDataURL('image/png'));
    };
    img.src = getProxyUrl(markUrl);
    return () => { alive = false; };
  }, [markUrl, hex]);
  return url;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/recolor.ts src/lib/__tests__/recolor.test.ts src/features/studio/hooks/use-recolored-mark.ts
git commit -m "feat(studio): deterministic recolor of black-on-white marks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Palette, voice, vector, and font-exclude generators

**Files:**
- Create: `src/ai/studio/palette.ts`, `src/ai/studio/voice.ts`, `src/ai/studio/vectorize-mark.ts`
- Modify: `src/ai/studio/pick-font.ts`
- Test: `src/ai/studio/__tests__/palette.test.ts`, `src/ai/studio/__tests__/voice.test.ts`, extend `src/ai/studio/__tests__/pick-font.test.ts`

**Interfaces:**
- Consumes: `tagLabel`, `withTimeout`, `jevEvaluate`, `BRAND_FONTS`, `PaletteColor` (Task 1).
- Produces:
  - `interface SlideBrief { name: string; pitch: string; audienceTags: string[]; styleTags: string[]; idea: string; feedback?: { chips: string[]; note?: string } }`
  - `buildPalettePrompt(b: SlideBrief): string`; `generatePalette(b: SlideBrief): Promise<PaletteColor[]>` (exactly 5, roles primary/secondary/accent/background/ink, hex `#RRGGBB`)
  - `buildVoicePrompt(b: SlideBrief): string`; `generateVoice(b: SlideBrief): Promise<{ tagline: string; story: string }>`
  - `vectorizeMark(markUrl: string): Promise<{ buffer: Buffer; contentType: string }>`
  - `buildFontQuestion(exclude?: string[]): JevQuestion`; `pickFont(state: object, exclude?: string[]): Promise<string>`

- [ ] **Step 1: Failing tests**

`src/ai/studio/__tests__/palette.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildPalettePrompt, PaletteSchema } from '../palette';

const brief = { name: 'Tidepool', pitch: 'A calm swim school for toddlers.', audienceTags: ['families'], styleTags: ['calm', 'warm'], idea: 'Parent and child form a heart.' };

describe('palette', () => {
  it('prompt includes brand, idea, style labels, and the five roles', () => {
    const p = buildPalettePrompt(brief);
    for (const s of ['Tidepool', 'Parent and child form a heart.', 'Calm, Warm', 'primary', 'secondary', 'accent', 'background', 'ink']) expect(p).toContain(s);
  });
  it('prompt carries feedback when given', () => {
    expect(buildPalettePrompt({ ...brief, feedback: { chips: ['warmer'], note: 'less pink' } })).toContain('Feedback: warmer. Note: less pink');
  });
  it('schema requires exactly five #RRGGBB colors', () => {
    const c = (role: string) => ({ hex: '#1A2B3C', name: 'Deep', role });
    expect(PaletteSchema.safeParse({ colors: ['primary', 'secondary', 'accent', 'background', 'ink'].map(c) }).success).toBe(true);
    expect(PaletteSchema.safeParse({ colors: [c('primary')] }).success).toBe(false);
    expect(PaletteSchema.safeParse({ colors: ['primary', 'secondary', 'accent', 'background', 'ink'].map(r => ({ ...c(r), hex: 'blue' })) }).success).toBe(false);
  });
});
```

`src/ai/studio/__tests__/voice.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildVoicePrompt } from '../voice';

const brief = { name: 'Tidepool', pitch: 'A calm swim school for toddlers.', audienceTags: ['families'], styleTags: ['calm'], idea: 'Parent and child form a heart.' };

describe('voice', () => {
  it('prompt asks for a short tagline and one-line story about the brand', () => {
    const p = buildVoicePrompt(brief);
    for (const s of ['Tidepool', 'A calm swim school for toddlers.', 'Families', 'max 8 words', 'one sentence']) expect(p).toContain(s);
  });
  it('prompt carries feedback when given', () => {
    expect(buildVoicePrompt({ ...brief, feedback: { chips: ['shorter'] } })).toContain('Feedback: shorter');
  });
});
```

Append to `src/ai/studio/__tests__/pick-font.test.ts`:
```ts
  it('can exclude fonts already used', () => {
    const q = buildFontQuestion(['Caprasimo', 'Aboreto']);
    if (q.type !== 'choice') throw new Error('expected choice');
    expect(Object.keys(q.criteria)).not.toContain('Caprasimo');
    expect(Object.keys(q.criteria)).not.toContain('Aboreto');
    expect(Object.keys(q.criteria)).toHaveLength(BRAND_FONTS.length - 2);
  });
```
(inside the existing `describe`).

- [ ] **Step 2: Run** `npx vitest run src/ai/studio` → FAIL (palette/voice missing; exclude not supported).

- [ ] **Step 3: Implement**

`src/ai/studio/palette.ts`:
```ts
import { z } from 'genkit';
import { tagLabel } from '@/lib/brand-tags';
import { withTimeout } from '@/lib/with-timeout';
import type { PaletteColor } from '@/features/studio/types';

export interface SlideBrief {
  name: string;
  pitch: string;
  audienceTags: string[];
  styleTags: string[];
  idea: string;
  feedback?: { chips: string[]; note?: string };
}

export function feedbackLine(f?: SlideBrief['feedback']): string | null {
  if (!f || (!f.chips.length && !f.note)) return null;
  return `Feedback: ${f.chips.join(', ')}${f.note ? `. Note: ${f.note}` : ''}`;
}

const ROLES = ['primary', 'secondary', 'accent', 'background', 'ink'] as const;

export const PaletteSchema = z.object({
  colors: z.array(z.object({
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    name: z.string().describe('Evocative 1-3 word color name'),
    role: z.enum(ROLES),
  })).length(5),
});

export function buildPalettePrompt(b: SlideBrief): string {
  const lines = [
    'You are a brand designer choosing a color palette for a logo direction.',
    `Brand: ${b.name}`,
    `What it does: ${b.pitch}`,
    `Audience: ${b.audienceTags.map(tagLabel).join(', ')}`,
    `Style: ${b.styleTags.map(tagLabel).join(', ')}`,
    `Logo idea: ${b.idea}`,
    'Return exactly five colors, one per role: primary (the mark color), secondary, accent, background (light, for slides), ink (dark, for text).',
    'Primary must read clearly on background. Hex as #RRGGBB.',
  ];
  const fb = feedbackLine(b.feedback);
  if (fb) lines.push(fb);
  return lines.join('\n');
}

export async function generatePalette(b: SlideBrief): Promise<PaletteColor[]> {
  const { ai } = await import('@/ai/genkit');
  const res = await withTimeout(ai.generate({ prompt: buildPalettePrompt(b), output: { schema: PaletteSchema } }), 45_000, 'Palette generation');
  if (!res.output) throw new Error('Palette generation returned no output');
  return ROLES.map(role => res.output!.colors.find(c => c.role === role) ?? res.output!.colors[ROLES.indexOf(role)]);
}
```

`src/ai/studio/voice.ts`:
```ts
import { z } from 'genkit';
import { tagLabel } from '@/lib/brand-tags';
import { withTimeout } from '@/lib/with-timeout';
import { feedbackLine, type SlideBrief } from './palette';

export const VoiceSchema = z.object({
  tagline: z.string().describe('Tagline, max 8 words'),
  story: z.string().describe('What the brand stands for, one sentence, max 25 words'),
});

export function buildVoicePrompt(b: SlideBrief): string {
  const lines = [
    'You are a brand copywriter.',
    `Brand: ${b.name}`,
    `What it does: ${b.pitch}`,
    `Audience: ${b.audienceTags.map(tagLabel).join(', ')}`,
    `Style: ${b.styleTags.map(tagLabel).join(', ')}`,
    `Logo idea: ${b.idea}`,
    'Write a tagline (max 8 words) and a story of what the brand stands for in one sentence (max 25 words). Plain words, no clichés, do not repeat the brand name in the tagline.',
  ];
  const fb = feedbackLine(b.feedback);
  if (fb) lines.push(fb);
  return lines.join('\n');
}

export async function generateVoice(b: SlideBrief): Promise<{ tagline: string; story: string }> {
  const { ai } = await import('@/ai/genkit');
  const res = await withTimeout(ai.generate({ prompt: buildVoicePrompt(b), output: { schema: VoiceSchema } }), 45_000, 'Voice generation');
  if (!res.output) throw new Error('Voice generation returned no output');
  return res.output;
}
```

`src/ai/studio/vectorize-mark.ts`:
```ts
import { fal } from '@fal-ai/client';
import { withTimeout } from '@/lib/with-timeout';

export async function vectorizeMark(markUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY is not set');
  fal.config({ credentials: process.env.FAL_KEY.trim() });
  const result = await withTimeout(fal.subscribe('fal-ai/recraft/vectorize', { input: { image_url: markUrl } }), 60_000, 'Vectorize');
  const url = (result.data as { image?: { url: string } })?.image?.url;
  if (!url) throw new Error('Vectorize returned no file');
  const res = await withTimeout(fetch(url), 30_000, 'SVG download');
  if (!res.ok) throw new Error(`SVG download failed (${res.status})`);
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: 'image/svg+xml' };
}
```

`src/ai/studio/pick-font.ts` — change signatures:
```ts
export function buildFontQuestion(exclude: string[] = []): JevQuestion {
  const criteria: Record<string, string> = {};
  for (const f of BRAND_FONTS) if (!exclude.includes(f.name)) criteria[f.name] = `${f.category.toLowerCase()} display typeface`;
  return { type: 'choice', instructions: 'Which typeface best suits this brand name and logo direction?', criteria };
}

export async function pickFont(state: object, exclude: string[] = []): Promise<string> {
  try {
    const answers = await jevEvaluate(state, { font: buildFontQuestion(exclude) });
    const a = answers.font;
    if (a?.type === 'choice' && BRAND_FONTS.some(f => f.name === a.choice) && !exclude.includes(a.choice)) return a.choice;
  } catch (error) {
    console.error('[pick-font] Jev failed, using fallback font:', error);
  }
  return BRAND_FONTS.find(f => !exclude.includes(f.name))?.name ?? 'Archivo';
}
```

- [ ] **Step 4: Verify the vectorize response field with one cheap real call** ($0.01) using an existing mark URL from the emulator (any `markUrl` on a `ready` direction):

```bash
KEY=$(grep '^FAL_KEY=' .env | cut -d= -f2- | tr -d '"'"'"' \r') && curl -s https://fal.run/fal-ai/recraft/vectorize -H "Authorization: Key $KEY" -H "Content-Type: application/json" -d '{"image_url":"<MARK_URL>"}' | head -c 300
```
Expected: JSON containing `"image":{"url":"https://…svg"`. If the field differs, update `vectorizeMark` accordingly.

- [ ] **Step 5: Run** `npx vitest run src/ai/studio` → PASS; `npm run typecheck`.

- [ ] **Step 6: Commit**

```bash
git add src/ai/studio/palette.ts src/ai/studio/voice.ts src/ai/studio/vectorize-mark.ts src/ai/studio/pick-font.ts src/ai/studio/__tests__/palette.test.ts src/ai/studio/__tests__/voice.test.ts src/ai/studio/__tests__/pick-font.test.ts
git commit -m "feat(studio): palette, voice, vector generators and font exclusion

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Slide pipeline (`runSlide`)

**Files:**
- Create: `src/ai/studio/run-slide.ts`
- Test: `src/ai/studio/__tests__/run-slide.emulator.test.ts`

**Interfaces:**
- Consumes: `ServerCredits`, `generateDirectionConcept`-shaped fn, `renderMark`-shaped fn, `SlideBrief`, `PaletteColor`, `GenerateKind`.
- Produces:
  - `interface SlideDeps { db: Firestore; credits: ServerCredits; generatePalette(b: SlideBrief): Promise<PaletteColor[]>; generateVoice(b: SlideBrief): Promise<{ tagline: string; story: string }>; vectorizeMark(url: string): Promise<{ buffer: Buffer; contentType: string }>; upload(buffer: Buffer, contentType: string, uid: string): Promise<string>; generateConcept(b: DirectionBrief): Promise<DirectionConcept>; renderMark(p: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }>; pickFont(state: object, exclude?: string[]): Promise<string> }`
  - `interface SlideJob { uid: string; brandId: string; directionId: string; kind: GenerateKind; chargeKey: string | null; cost: number; brief: Omit<DirectionBrief, 'recipe'>; feedback?: { chips: string[]; note?: string } }`
  - `runSlide(deps: SlideDeps, job: SlideJob): Promise<void>`
- Writes on the direction doc: `slides.color = { status:'ready', palette }`, `slides.voice = { status:'ready', tagline, story }`, `slides.vector = { status:'ready', svgUrl }`; mark: `{ status:'ready', stage:'mark', markUrl, concept }` and `slides.vector` deleted; lockup: `{ fontName }`. On error: paid slide `slides.<kind>.status='failed'` / mark `status:'failed'`, plus full refund.

- [ ] **Step 1: Failing test** `src/ai/studio/__tests__/run-slide.emulator.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';
import { createServerCredits } from '@/lib/server-credits';
import { INITIAL_CREDITS } from '@/lib/credits';
import { runSlide, type SlideDeps } from '../run-slide';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;
const palette = ['primary', 'secondary', 'accent', 'background', 'ink'].map(role => ({ hex: '#112233', name: 'Deep', role })) as never;

describe.skipIf(!ON)('runSlide (emulator)', () => {
  let db: Firestore;
  beforeAll(() => {
    const app = getApps().find(a => a.name === 'slide-test') ?? initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'slide-test');
    db = getFirestore(app);
  });

  async function setup(overrides: Partial<SlideDeps> = {}) {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const credits = createServerCredits(db);
    const ref = db.doc(`users/${uid}/brands/b/directions/d`);
    await ref.set({
      roundId: 'r', status: 'ready', markUrl: 'https://r2.example/old.png', fontName: 'Caprasimo',
      recipe: { ideaType: 'lettermark', styleLean: 'bold', model: 'recraft' },
      concept: { idea: 'An idea', rationale: 'r', markPrompt: 'p', captions: { mark: 'm', lockup: 'l', inUse: 'u' } },
      slides: { vector: { status: 'ready', svgUrl: 'https://r2.example/old.svg' } },
      createdAt: FieldValue.serverTimestamp(),
    });
    const deps: SlideDeps = {
      db, credits,
      generatePalette: async () => palette,
      generateVoice: async () => ({ tagline: 'Float together', story: 'Swimming made calm.' }),
      vectorizeMark: async () => ({ buffer: Buffer.from('<svg/>'), contentType: 'image/svg+xml' }),
      upload: async (_b, ct) => (ct.includes('svg') ? 'https://r2.example/new.svg' : 'https://r2.example/new.png'),
      generateConcept: async () => ({ idea: 'Simpler idea', rationale: 'r', markPrompt: 'p2', captions: { mark: 'm2', lockup: 'l2', inUse: 'u2' } }),
      renderMark: async () => ({ buffer: Buffer.from('x'), contentType: 'image/png' }),
      pickFont: async (_s, exclude) => (exclude?.includes('Caprasimo') ? 'Archivo' : 'Caprasimo'),
      ...overrides,
    };
    const base = { name: 'N', pitch: 'P', audienceTags: [], styleTags: [] };
    return { uid, credits, ref, deps, base };
  }

  it('color writes a ready palette', async () => {
    const { uid, credits, ref, deps, base } = await setup();
    await credits.charge({ uid, amount: 5, action: 'studioColor', key: 'k1' });
    await runSlide(deps, { uid, brandId: 'b', directionId: 'd', kind: 'color', chargeKey: 'k1', cost: 5, brief: base });
    const d = (await ref.get()).data()!;
    expect(d.slides.color.status).toBe('ready');
    expect(d.slides.color.palette).toHaveLength(5);
  });

  it('failed vector refunds its cost and leaves other slides alone', async () => {
    const { uid, credits, ref, deps, base } = await setup({ vectorizeMark: async () => { throw new Error('fal down'); } });
    await credits.charge({ uid, amount: 5, action: 'studioVector', key: 'k2' });
    await runSlide(deps, { uid, brandId: 'b', directionId: 'd', kind: 'vector', chargeKey: 'k2', cost: 5, brief: base });
    const d = (await ref.get()).data()!;
    expect(d.slides.vector.status).toBe('failed');
    expect(d.slides.vector.error).toContain('fal down');
    expect(d.markUrl).toBe('https://r2.example/old.png');
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS);
  });

  it('mark redo replaces the mark and concept, and clears the stale vector', async () => {
    const { uid, credits, ref, deps, base } = await setup();
    await credits.charge({ uid, amount: 5, action: 'studioMarkRedo', key: 'k3' });
    await runSlide(deps, { uid, brandId: 'b', directionId: 'd', kind: 'mark', chargeKey: 'k3', cost: 5, brief: base, feedback: { chips: ['simpler'] } });
    const d = (await ref.get()).data()!;
    expect(d.status).toBe('ready');
    expect(d.markUrl).toBe('https://r2.example/new.png');
    expect(d.concept.idea).toBe('Simpler idea');
    expect(d.slides?.vector).toBeUndefined();
  });

  it('lockup picks a different font for free', async () => {
    const { uid, ref, deps, base } = await setup();
    await runSlide(deps, { uid, brandId: 'b', directionId: 'd', kind: 'lockup', chargeKey: null, cost: 0, brief: base, feedback: { chips: ['different font'] } });
    expect((await ref.get()).data()?.fontName).toBe('Archivo');
  });
});
```

- [ ] **Step 2: Run** `npm run test:emulator` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/ai/studio/run-slide.ts`:

```ts
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { LogoProvider } from '@/ai/logo-models';
import type { ServerCredits } from '@/lib/server-credits';
import type { GenerateKind, PaletteColor } from '@/features/studio/types';
import type { DirectionBrief, DirectionConcept } from './direction-concept';
import type { SlideBrief } from './palette';

export interface SlideDeps {
  db: Firestore;
  credits: ServerCredits;
  generatePalette(b: SlideBrief): Promise<PaletteColor[]>;
  generateVoice(b: SlideBrief): Promise<{ tagline: string; story: string }>;
  vectorizeMark(url: string): Promise<{ buffer: Buffer; contentType: string }>;
  upload(buffer: Buffer, contentType: string, uid: string): Promise<string>;
  generateConcept(b: DirectionBrief): Promise<DirectionConcept>;
  renderMark(provider: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }>;
  pickFont(state: object, exclude?: string[]): Promise<string>;
}

export interface SlideJob {
  uid: string;
  brandId: string;
  directionId: string;
  kind: GenerateKind;
  chargeKey: string | null;
  cost: number;
  brief: Omit<DirectionBrief, 'recipe'>;
  feedback?: { chips: string[]; note?: string };
}

export async function runSlide(deps: SlideDeps, job: SlideJob): Promise<void> {
  const ref = deps.db.doc(`users/${job.uid}/brands/${job.brandId}/directions/${job.directionId}`);
  const now = () => FieldValue.serverTimestamp();
  try {
    const d = (await ref.get()).data();
    if (!d) throw new Error('Direction not found');
    const slideBrief: SlideBrief = { ...job.brief, idea: d.concept?.idea ?? job.brief.pitch, feedback: job.feedback };

    switch (job.kind) {
      case 'color': {
        const palette = await deps.generatePalette(slideBrief);
        await ref.update({ 'slides.color': { status: 'ready', palette }, updatedAt: now() });
        return;
      }
      case 'voice': {
        const voice = await deps.generateVoice(slideBrief);
        await ref.update({ 'slides.voice': { status: 'ready', ...voice }, updatedAt: now() });
        return;
      }
      case 'vector': {
        if (!d.markUrl) throw new Error('No mark to vectorize');
        const svg = await deps.vectorizeMark(d.markUrl);
        const svgUrl = await deps.upload(svg.buffer, svg.contentType, job.uid);
        await ref.update({ 'slides.vector': { status: 'ready', svgUrl }, updatedAt: now() });
        return;
      }
      case 'mark': {
        await ref.update({ status: 'generating', stage: 'concept', updatedAt: now() });
        const feedbackChips = [...(job.feedback?.chips ?? []), ...(job.feedback?.note ? [job.feedback.note] : [])];
        const concept = await deps.generateConcept({ ...job.brief, recipe: d.recipe, feedbackChips, seedIdea: d.concept?.idea });
        await ref.update({ concept, stage: 'mark', updatedAt: now() });
        const image = await deps.renderMark(d.recipe.model, concept.markPrompt);
        const markUrl = await deps.upload(image.buffer, image.contentType, job.uid);
        await ref.update({ status: 'ready', markUrl, 'slides.vector': FieldValue.delete(), updatedAt: now() });
        return;
      }
      case 'lockup': {
        const fontName = await deps.pickFont({ brandName: job.brief.name, idea: slideBrief.idea, feedback: job.feedback?.chips }, d.fontName ? [d.fontName] : []);
        await ref.update({ fontName, updatedAt: now() });
        return;
      }
    }
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 300);
    console.error(`[studio] slide ${job.kind} on ${job.directionId} failed:`, error);
    const failure = job.kind === 'mark'
      ? { status: 'failed', error: message }
      : job.kind === 'lockup'
        ? {}
        : { [`slides.${job.kind}.status`]: 'failed', [`slides.${job.kind}.error`]: message };
    await ref.update({ ...failure, updatedAt: now() }).catch(() => {});
    if (job.chargeKey && job.cost > 0) {
      await deps.credits.refund({ uid: job.uid, key: job.chargeKey, amount: job.cost, reason: `${job.kind} failed` }).catch(console.error);
    }
  }
}
```

- [ ] **Step 4: Run** `npm run test:emulator` → PASS (all, including 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/ai/studio/run-slide.ts src/ai/studio/__tests__/run-slide.emulator.test.ts
git commit -m "feat(studio): slide pipeline for color, voice, vector, mark redo, and font change

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `requestSlide` (charge + mark pending) and the `generateSlide` action

**Files:**
- Create: `src/ai/studio/request-slide.ts`
- Modify: `src/app/studio/actions.ts`
- Test: `src/ai/studio/__tests__/request-slide.emulator.test.ts`

**Interfaces:**
- Consumes: `ServerCredits`, `InsufficientCreditsError`, `GENERATE_COSTS`, `GenerateKind`, `SLIDE_FEEDBACK_CHIPS`, `runSlide`, `SlideDeps`.
- Produces:
  - `requestSlide(db: Firestore, credits: ServerCredits, a: { uid: string; brandId: string; directionId: string; kind: GenerateKind; clientRequestId: string; feedback?: { chips: string[]; note?: string } }): Promise<{ status: 'scheduled' | 'duplicate'; chargeKey: string | null; cost: number }>` — throws `InsufficientCreditsError`; throws `Error('Direction not ready')` when kind ≠ `mark` and the direction has no `markUrl`.
  - Server action `generateSlide(idToken: string, brandId: string, directionId: string, kind: GenerateKind, clientRequestId: string, feedback?: { chips: string[]; note?: string }): Promise<{ success: boolean; error?: string; insufficient?: boolean; needed?: number; balance?: number }>`

- [ ] **Step 1: Failing test** `src/ai/studio/__tests__/request-slide.emulator.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createServerCredits, InsufficientCreditsError } from '@/lib/server-credits';
import { INITIAL_CREDITS } from '@/lib/credits';
import { requestSlide } from '../request-slide';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!ON)('requestSlide (emulator)', () => {
  let db: Firestore;
  beforeAll(() => {
    const app = getApps().find(a => a.name === 'req-slide-test') ?? initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'req-slide-test');
    db = getFirestore(app);
  });
  const setup = async (dir: Record<string, unknown> = { status: 'ready', markUrl: 'https://x/m.png' }) => {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    await db.doc(`users/${uid}/brands/b/directions/d`).set(dir);
    return { uid, credits: createServerCredits(db) };
  };

  it('same request id charges once and schedules once', async () => {
    const { uid, credits } = await setup();
    const a = { uid, brandId: 'b', directionId: 'd', kind: 'color' as const, clientRequestId: 'req12345' };
    const [r1, r2] = await Promise.all([requestSlide(db, credits, a), requestSlide(db, credits, a)]);
    expect([r1.status, r2.status].sort()).toEqual(['duplicate', 'scheduled']);
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS - 5);
    const slide = (await db.doc(`users/${uid}/brands/b/directions/d`).get()).data()!.slides.color;
    expect(slide.status).toBe('pending');
    expect(slide.chargeKey).toBe('slide_d_req12345');
    expect(slide.cost).toBe(5);
  });

  it('insufficient credits writes nothing', async () => {
    const { uid, credits } = await setup();
    await credits.ensureProfile(uid);
    await db.doc(`userProfiles/${uid}`).update({ balance: 1 });
    await expect(requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'voice', clientRequestId: 'req99999' }))
      .rejects.toBeInstanceOf(InsufficientCreditsError);
    expect((await db.doc(`users/${uid}/brands/b/directions/d`).get()).data()!.slides).toBeUndefined();
  });

  it('refuses paid slides before the mark exists, but allows a mark retry on a failed direction', async () => {
    const { uid, credits } = await setup({ status: 'failed' });
    await expect(requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'color', clientRequestId: 'req11111' })).rejects.toThrow('Direction not ready');
    const r = await requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'mark', clientRequestId: 'req22222' });
    expect(r.status).toBe('scheduled');
    const d = (await db.doc(`users/${uid}/brands/b/directions/d`).get()).data()!;
    expect(d.status).toBe('generating');
    expect(d.redoChargeKey).toBe('slide_d_req22222');
  });

  it('lockup font change is free and needs no charge key', async () => {
    const { uid, credits } = await setup();
    const r = await requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'lockup', clientRequestId: 'req33333' });
    expect(r).toEqual({ status: 'scheduled', chargeKey: null, cost: 0 });
  });
});
```

- [ ] **Step 2: Run** `npm run test:emulator` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/ai/studio/request-slide.ts`:

```ts
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { ServerCredits } from '@/lib/server-credits';
import type { CreditAction } from '@/lib/credits';
import { GENERATE_COSTS, type GenerateKind } from '@/features/studio/types';

const ACTIONS: Record<GenerateKind, CreditAction | null> = {
  color: 'studioColor', voice: 'studioVoice', vector: 'studioVector', mark: 'studioMarkRedo', lockup: null,
};

export async function requestSlide(
  db: Firestore,
  credits: ServerCredits,
  a: { uid: string; brandId: string; directionId: string; kind: GenerateKind; clientRequestId: string; feedback?: { chips: string[]; note?: string } }
): Promise<{ status: 'scheduled' | 'duplicate'; chargeKey: string | null; cost: number }> {
  const ref = db.doc(`users/${a.uid}/brands/${a.brandId}/directions/${a.directionId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Direction not found');
  if (a.kind !== 'mark' && !snap.data()?.markUrl) throw new Error('Direction not ready');

  const cost = GENERATE_COSTS[a.kind];
  const action = ACTIONS[a.kind];
  const chargeKey = action ? `slide_${a.directionId}_${a.clientRequestId}` : null;
  if (action && chargeKey) {
    const { alreadyCharged } = await credits.charge({ uid: a.uid, amount: cost, action, key: chargeKey });
    if (alreadyCharged) return { status: 'duplicate', chargeKey, cost };
  }

  const pending =
    a.kind === 'mark' ? { status: 'generating', stage: 'concept', redoChargeKey: chargeKey, redoCost: cost, redoRequestedAt: FieldValue.serverTimestamp() }
    : a.kind === 'lockup' ? {}
    : { [`slides.${a.kind}`]: { status: 'pending', chargeKey, cost, requestedAt: FieldValue.serverTimestamp() } };
  const feedbackEntry = a.feedback && (a.feedback.chips.length || a.feedback.note)
    ? { feedback: FieldValue.arrayUnion({ slideKind: a.kind, chips: a.feedback.chips, note: a.feedback.note ?? null, at: new Date().toISOString() }) }
    : {};
  await ref.update({ ...pending, ...feedbackEntry, updatedAt: FieldValue.serverTimestamp() });
  await db.collection('events').add({
    type: a.feedback ? 'slide_feedback' : 'slide_generated', uid: a.uid, brandId: a.brandId, directionId: a.directionId,
    kind: a.kind, chips: a.feedback?.chips ?? [], recipe: snap.data()?.recipe ?? null, createdAt: FieldValue.serverTimestamp(),
  });
  return { status: 'scheduled', chargeKey, cost };
}
```

- [ ] **Step 4: Run** `npm run test:emulator` → PASS.

- [ ] **Step 5: Server action** — append to `src/app/studio/actions.ts` (add imports for `requestSlide`, `runSlide`, `generatePalette`, `generateVoice`, `vectorizeMark`, `SLIDE_FEEDBACK_CHIPS`, `type GenerateKind`):

```ts
const GENERATE_KINDS: readonly GenerateKind[] = ['color', 'voice', 'vector', 'mark', 'lockup'];

export async function generateSlide(
  idToken: string,
  brandId: string,
  directionId: string,
  kind: GenerateKind,
  clientRequestId: string,
  feedback?: { chips: string[]; note?: string }
): Promise<Result<{ directionId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(directionId) || !ID.test(clientRequestId)) return { success: false, error: 'Invalid id' };
    if (!GENERATE_KINDS.includes(kind)) return { success: false, error: 'Unknown slide' };
    const allowedChips: readonly string[] = (SLIDE_FEEDBACK_CHIPS as Record<string, readonly string[]>)[kind] ?? [];
    const cleanFeedback = feedback
      ? { chips: feedback.chips.filter(c => allowedChips.includes(c)), note: feedback.note?.trim().slice(0, 200) || undefined }
      : undefined;

    const brand = (await adminDb.doc(`users/${uid}/brands/${brandId}`).get()).data();
    if (!brand) return { success: false, error: 'Brand not found' };

    const credits = createServerCredits(adminDb);
    let req;
    try {
      req = await requestSlide(adminDb, credits, { uid, brandId, directionId, kind, clientRequestId, feedback: cleanFeedback });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return { success: false, insufficient: true, needed: error.needed, balance: error.balance, error: `This needs ${error.needed} credits; you have ${error.balance}.` };
      }
      throw error;
    }
    if (req.status === 'duplicate') return { success: true, data: { directionId } };

    after(() =>
      runSlide(
        {
          db: adminDb, credits, generatePalette, generateVoice, vectorizeMark,
          upload: (buffer, contentType, owner) => uploadBufferToR2(buffer, contentType, `studio/${owner}`),
          generateConcept: generateDirectionConcept, renderMark, pickFont,
        },
        {
          uid, brandId, directionId, kind, chargeKey: req.chargeKey, cost: req.cost, feedback: cleanFeedback,
          brief: { name: brand.latestName, pitch: brand.latestElevatorPitch, audienceTags: brand.audienceTags ?? [], styleTags: brand.styleTags ?? [] },
        }
      )
    );
    return { success: true, data: { directionId } };
  } catch (error) {
    return fail(error);
  }
}
```

- [ ] **Step 6: Mark-redo refund key in `runSlide`** — `requestSlide` stores the mark charge as `redoChargeKey`; `runSlide` already receives `chargeKey` in the job, so no change. Verify `npm run typecheck && npm run lint && npm test` pass.

- [ ] **Step 7: Commit**

```bash
git add src/ai/studio/request-slide.ts src/ai/studio/__tests__/request-slide.emulator.test.ts src/app/studio/actions.ts
git commit -m "feat(studio): generateSlide action with idempotent charges, feedback, and events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Sweep stuck slides and stuck mark redos

**Files:**
- Modify: `src/ai/studio/sweep-stale.ts`
- Test: extend `src/ai/studio/__tests__/sweep-stale.emulator.test.ts`

**Interfaces:**
- Consumes: `SlideState` fields `requestedAt/chargeKey/cost`; direction `redoChargeKey/redoCost/redoRequestedAt`.
- Produces: `sweepStaleDirections` also fails + refunds (a) `slides.{color,voice,vector}` with `status:'pending'` and `requestedAt` older than `STALE_DIRECTION_MS`, (b) directions `generating` whose `redoRequestedAt` is older than the limit (refund `redoCost` with `redoChargeKey`). Returned count includes these.

- [ ] **Step 1: Failing test** — add to the sweep test file:

```ts
  it('fails and refunds stuck paid slides and stuck mark redos', async () => {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const credits = createServerCredits(db);
    await credits.charge({ uid, amount: 5, action: 'studioVector', key: 'slide_v' });
    await credits.charge({ uid, amount: 5, action: 'studioMarkRedo', key: 'slide_m' });
    const now = Date.now();
    const old = Timestamp.fromMillis(now - STALE_DIRECTION_MS - 60_000);
    const fresh = Timestamp.fromMillis(now - 10_000);
    const base = `users/${uid}/brands/b/directions`;
    await db.doc(`${base}/withSlide`).set({ status: 'ready', createdAt: old, slides: {
      vector: { status: 'pending', chargeKey: 'slide_v', cost: 5, requestedAt: old },
      voice: { status: 'pending', chargeKey: 'slide_x', cost: 2, requestedAt: fresh },
    } });
    await db.doc(`${base}/redo`).set({ status: 'generating', createdAt: old, redoChargeKey: 'slide_m', redoCost: 5, redoRequestedAt: old });

    expect(await sweepStaleDirections(db, credits, { uid, brandId: 'b', now })).toBe(2);
    const s = (await db.doc(`${base}/withSlide`).get()).data()!.slides;
    expect(s.vector.status).toBe('failed');
    expect(s.voice.status).toBe('pending');
    expect((await db.doc(`${base}/redo`).get()).data()?.status).toBe('failed');
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS);
  });
```

- [ ] **Step 2: Run** `npm run test:emulator` → FAIL (count 0, slides untouched).

- [ ] **Step 3: Implement** — in `sweep-stale.ts`, (a) inside the existing loop, use `redoRequestedAt ?? createdAt` as the start time and refund `redoCost ?? STUDIO_DIRECTION_REFUND` with `redoChargeKey ?? chargeKey`; (b) after the loop, scan directions with `status == 'ready'` for stale pending slides:

```ts
  // (a) in the unfinished loop, replace the age + refund lines with:
    const data = d.data();
    const startedAt = (data.redoRequestedAt ?? data.createdAt) as Timestamp | undefined;
    if (!startedAt || now - startedAt.toMillis() < STALE_DIRECTION_MS) continue;
    // …claim transaction unchanged…
    const key = (data.redoChargeKey ?? data.chargeKey) as string | undefined;
    const amount = (data.redoCost ?? STUDIO_DIRECTION_REFUND) as number;
    if (key) await credits.refund({ uid, key, amount, reason: 'direction timed out' });

  // (b) after the loop:
  const ready = await dirs.where('status', '==', 'ready').get();
  for (const d of ready.docs) {
    const slides = (d.data().slides ?? {}) as Record<string, { status?: string; requestedAt?: Timestamp; chargeKey?: string; cost?: number }>;
    for (const [kind, s] of Object.entries(slides)) {
      if (s?.status !== 'pending' || !s.requestedAt || now - s.requestedAt.toMillis() < STALE_DIRECTION_MS) continue;
      const claimed = await db.runTransaction(async tx => {
        const snap = await tx.get(d.ref);
        if (snap.data()?.slides?.[kind]?.status !== 'pending') return false;
        tx.update(d.ref, { [`slides.${kind}.status`]: 'failed', [`slides.${kind}.error`]: 'Timed out' });
        return true;
      });
      if (!claimed) continue;
      swept++;
      if (s.chargeKey && s.cost) await credits.refund({ uid, key: s.chargeKey, amount: s.cost, reason: `${kind} timed out` });
    }
  }
```

- [ ] **Step 4: Run** `npm run test:emulator` → PASS (both sweep tests).

- [ ] **Step 5: Commit**

```bash
git add src/ai/studio/sweep-stale.ts src/ai/studio/__tests__/sweep-stale.emulator.test.ts
git commit -m "feat(studio): sweep refunds stuck slides and mark redos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Split sticker and app icon slides; brand-written typography

Owner requests (2026-10-11): the sticker gets its own full-bleed laptop slide, the app icon is a separate slide, and the typography slide shows brand-appropriate generated text.

**Files:**
- Modify: `src/ai/studio/direction-concept.ts` (schema + prompt), `src/ai/studio/__tests__/direction-concept.test.ts`, stubs in `src/ai/studio/__tests__/run-round.emulator.test.ts` and `run-slide.emulator.test.ts`
- Create: `src/features/studio/components/slides/sticker-slide.tsx`, `src/features/studio/components/slides/app-icon-slide.tsx`
- Modify: `src/features/studio/components/slides/typography-slide.tsx`
- Delete: `src/features/studio/components/slides/in-use-slide.tsx`

**Interfaces:**
- Produces: `DirectionConcept.typeSample: { headline: string; body: string }` (generated with the concept, no extra call or cost); `StickerSlide({ markUrl })`; `AppIconSlide({ markUrl, name, color? })`; `TypographySlide({ name, fontName?, sample?: { headline: string; body: string } })`.

- [ ] **Step 1: Failing test** — append to `src/ai/studio/__tests__/direction-concept.test.ts` (and import `DirectionConceptSchema`):

```ts
  it('asks for a brand-voiced type specimen', () => {
    expect(buildDirectionConceptPrompt(brief)).toContain('type specimen');
  });
  it('schema requires a type sample with headline and body', () => {
    const base = { idea: 'i', rationale: 'r', markPrompt: 'p', captions: { mark: 'm', lockup: 'l', inUse: 'u' } };
    expect(DirectionConceptSchema.safeParse(base).success).toBe(false);
    expect(DirectionConceptSchema.safeParse({ ...base, typeSample: { headline: 'Float together', body: 'Swim lessons built around calm.' } }).success).toBe(true);
  });
```

- [ ] **Step 2: Run** `npx vitest run src/ai/studio/__tests__/direction-concept.test.ts` → FAIL (2 new cases).

- [ ] **Step 3: Implement** — in `DirectionConceptSchema` add:

```ts
  typeSample: z.object({
    headline: z.string().describe('A short headline in the brand voice, max 6 words, to show off the typeface. Not the brand name.'),
    body: z.string().describe('One sentence of body copy in the brand voice, max 20 words.'),
  }),
```

and in `buildDirectionConceptPrompt`, before `'Keep every caption short and visual. No marketing fluff.'`, add the line
`'Also write a short type specimen in the brand\'s voice: a headline (max 6 words, not the brand name) and one body sentence (max 20 words) that this brand would really say.',`.
Update the `generateConcept` stubs in `run-round.emulator.test.ts` and `run-slide.emulator.test.ts` to include `typeSample: { headline: 'h', body: 'b' }`.

- [ ] **Step 4: Run** `npx vitest run src/ai/studio` → PASS; `npm run test:emulator` → PASS; `npm run typecheck`.

- [ ] **Step 5: Slides**

`slides/sticker-slide.tsx` (full-bleed laptop, same asset and sticker effect as the old editor):
```tsx
'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { createStickerEffect } from '@/lib/sticker-effect';

export function StickerSlide({ markUrl }: { markUrl: string }) {
  const [sticker, setSticker] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    createStickerEffect(markUrl).then(s => { if (alive) setSticker(s); });
    return () => { alive = false; };
  }, [markUrl]);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/laptop-keyboard-mockup.webp')" }}>
      {sticker && (
        <img src={sticker} alt="Sticker on a laptop" className="h-[30cqw] w-auto -rotate-12 object-contain opacity-90"
          style={{ filter: 'drop-shadow(rgba(0,0,0,0.35) -0.3cqw 0.4cqw 0.2cqw)' }} />
      )}
    </div>
  );
}
```

`slides/app-icon-slide.tsx`:
```tsx
'use client';
/* eslint-disable @next/next/no-img-element */
import { useRecoloredMark } from '../../hooks/use-recolored-mark';

export function AppIconSlide({ markUrl, name, color }: { markUrl: string; name: string; color?: string }) {
  const white = useRecoloredMark(markUrl, '#FFFFFF');
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2cqw] bg-neutral-100">
      <div className="flex h-[28cqw] w-[28cqw] items-center justify-center rounded-[22%] shadow-lg" style={{ background: color ?? '#000000' }}>
        {white && <img src={white} alt="" className="h-[60%] w-auto object-contain" />}
      </div>
      <span style={{ fontSize: '2.6cqw' }} className="text-neutral-700">{name}</span>
    </div>
  );
}
```

`slides/typography-slide.tsx`:
```tsx
import { BRAND_FONTS } from '@/config/brand-fonts';

export function TypographySlide({ name, fontName, sample }: { name: string; fontName?: string; sample?: { headline: string; body: string } }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[2.5cqw] px-[8cqw]">
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: `${8 * font.sizeMultiplier}cqw` }} className="leading-[1.05]">
        {sample?.headline ?? name}
      </span>
      {sample?.body && <span style={{ fontSize: '2.8cqw' }} className="font-sans leading-snug text-neutral-700">{sample.body}</span>}
      <span style={{ fontSize: '2.2cqw' }} className="font-sans text-muted-foreground">{font.name} · Geist Sans</span>
    </div>
  );
}
```

Delete `slides/in-use-slide.tsx` (`git rm`).

- [ ] **Step 6: Commit**

```bash
git add -A src/ai/studio src/features/studio/components/slides
git commit -m "feat(studio): separate laptop sticker and app icon slides; brand-written type specimen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Slide UI — placeholders, new slides, feedback, retry, status

**Files:**
- Create: `src/features/studio/hooks/use-slide-request.ts`, `src/features/studio/components/slide-placeholder.tsx`, `src/features/studio/components/slide-feedback.tsx`, `src/features/studio/components/slides/{color-slide,business-card-slide,social-slide,voice-slide,vector-slide}.tsx`
- Modify: `src/features/studio/components/slide-frame.tsx` (feedback slot + failed state), `src/features/studio/components/direction-row.tsx`, `src/features/studio/components/round-block.tsx`, `src/app/studio/[brandId]/studio-client.tsx`

**Interfaces:**
- Consumes: `generateSlide` (Task 5), `stageLabel` (Task 1), `useRecoloredMark` (Task 2), `StickerSlide`, `AppIconSlide`, `TypographySlide` with `sample` (Task 7), `SLIDE_FEEDBACK_CHIPS`, `GENERATE_COSTS`, `PaletteColor`, `DirectionSlides`.
- Produces: `useSlideRequest(brandId: string)` → `{ request(directionId: string, kind: GenerateKind, feedback?: { chips: string[]; note?: string }): Promise<void>; busy: Record<string, boolean>; creditError: string | null }`.

- [ ] **Step 1: Request hook** `src/features/studio/hooks/use-slide-request.ts`:

```ts
'use client';

import { useCallback, useRef, useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateSlide } from '@/app/studio/actions';
import type { GenerateKind } from '../types';

export function useSlideRequest(brandId: string) {
  const { user } = useUser();
  const { toast } = useToast();
  const ids = useRef<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [creditError, setCreditError] = useState<string | null>(null);

  const request = useCallback(async (directionId: string, kind: GenerateKind, feedback?: { chips: string[]; note?: string }) => {
    const slot = `${directionId}:${kind}`;
    if (!user || busy[slot]) return;
    setBusy(b => ({ ...b, [slot]: true }));
    setCreditError(null);
    ids.current[slot] ??= crypto.randomUUID().replace(/-/g, '');
    const res = await generateSlide(await user.getIdToken(), brandId, directionId, kind, ids.current[slot], feedback);
    delete ids.current[slot];
    if (res.insufficient) setCreditError(res.error ?? 'Not enough credits');
    else if (!res.success) toast({ variant: 'destructive', title: 'Could not generate', description: res.error });
    setBusy(b => ({ ...b, [slot]: false }));
  }, [user, brandId, busy, toast]);

  return { request, busy, creditError };
}
```

- [ ] **Step 2: Slide frame feedback slot** — replace `src/features/studio/components/slide-frame.tsx` with:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SlideFrame({ caption, status, children, className, overlay, style }: {
  caption?: string;
  status: 'loading' | 'ready' | 'failed';
  children?: ReactNode;
  className?: string;
  overlay?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <figure className="group w-[320px] shrink-0 space-y-2">
      <div
        style={{ containerType: 'inline-size', ...style }}
        className={cn(
          'relative aspect-video overflow-hidden rounded-xl border bg-white',
          status === 'loading' && 'animate-pulse bg-muted',
          className
        )}
      >
        {status !== 'loading' && children}
        {status === 'ready' && overlay}
      </div>
      {caption && status === 'ready' && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
```

- [ ] **Step 3: Placeholder** `src/features/studio/components/slide-placeholder.tsx`:

```tsx
'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SlidePlaceholder({ label, cost, state, onGenerate }: {
  label: string;
  cost: number;
  state: 'idle' | 'pending' | 'failed';
  onGenerate: () => void;
}) {
  return (
    <figure className="w-[320px] shrink-0 space-y-2">
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-sm text-muted-foreground">
        {state === 'pending' ? (
          <><Loader2 className="h-5 w-5 animate-spin" /><span>Making {label.toLowerCase()}…</span></>
        ) : (
          <>
            {state === 'failed' && <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4" />Didn&apos;t work; credits refunded</span>}
            <span className="font-medium text-foreground">{label}</span>
            <Button size="sm" variant="outline" onClick={onGenerate}>
              {state === 'failed' ? 'Retry' : 'Generate'} · {cost === 0 ? 'free' : `${cost} credits`}
            </Button>
          </>
        )}
      </div>
    </figure>
  );
}
```

- [ ] **Step 4: Feedback popover** `src/features/studio/components/slide-feedback.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SLIDE_FEEDBACK_CHIPS, GENERATE_COSTS, type FeedbackSlideKind } from '../types';

export function SlideFeedback({ kind, onApply }: {
  kind: FeedbackSlideKind;
  onApply: (feedback: { chips: string[]; note?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const cost = GENERATE_COSTS[kind];
  const apply = () => {
    onApply({ chips, note: note.trim() || undefined });
    setOpen(false); setChips([]); setNote('');
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Click to give feedback"
          className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" /> Feedback
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <div className="flex flex-wrap gap-2">
          {SLIDE_FEEDBACK_CHIPS[kind].map(c => (
            <button key={c} type="button" aria-pressed={chips.includes(c)}
              onClick={() => setChips(cs => (cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]))}
              className={cn('rounded-full border px-3 py-1 text-xs', chips.includes(c) ? 'border-foreground bg-foreground text-background' : 'hover:border-foreground/40')}>
              {c}
            </button>
          ))}
        </div>
        <Input placeholder="Anything else? (optional)" value={note} maxLength={200} onChange={e => setNote(e.target.value)} />
        <Button size="sm" className="w-full" onClick={apply} disabled={!chips.length && !note.trim()}>
          Redo this slide · {cost === 0 ? 'free' : `${cost} credits`}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 5: New slides**

`slides/color-slide.tsx`:
```tsx
'use client';
/* eslint-disable @next/next/no-img-element */
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import type { PaletteColor } from '../../types';

export function ColorSlide({ markUrl, palette }: { markUrl: string; palette: PaletteColor[] }) {
  const byRole = Object.fromEntries(palette.map(c => [c.role, c])) as Record<PaletteColor['role'], PaletteColor>;
  const colored = useRecoloredMark(markUrl, byRole.primary?.hex);
  return (
    <div className="absolute inset-0 flex" style={{ background: byRole.background?.hex }}>
      <div className="flex flex-1 items-center justify-center">
        {colored && <img src={colored} alt="Colored mark" className="h-[45cqw] w-auto object-contain" />}
      </div>
      <div className="flex w-[30cqw] flex-col">
        {palette.map(c => (
          <div key={c.role} className="flex flex-1 items-end p-[1.5cqw]" style={{ background: c.hex }}>
            <span style={{ fontSize: '2.2cqw', color: c.role === 'ink' || c.role === 'primary' ? byRole.background?.hex : byRole.ink?.hex }}>
              {c.name} · {c.hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

`slides/business-card-slide.tsx`:
```tsx
'use client';
/* eslint-disable @next/next/no-img-element */
import { BRAND_FONTS } from '@/config/brand-fonts';
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import type { PaletteColor } from '../../types';

export function BusinessCardSlide({ markUrl, palette, name, fontName }: { markUrl: string; palette: PaletteColor[]; name: string; fontName?: string }) {
  const c = Object.fromEntries(palette.map(p => [p.role, p.hex])) as Record<PaletteColor['role'], string>;
  const light = useRecoloredMark(markUrl, c.background);
  const dark = useRecoloredMark(markUrl, c.primary);
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[5cqw] bg-neutral-200">
      <div className="flex h-[32cqw] w-[54cqw] -rotate-3 items-center justify-center rounded-[1.5cqw] shadow-lg" style={{ background: c.primary }}>
        {light && <img src={light} alt="" className="h-[16cqw] w-auto" />}
      </div>
      <div className="absolute bottom-[8cqw] right-[8cqw] flex h-[24cqw] w-[40cqw] rotate-2 items-center gap-[2cqw] rounded-[1.2cqw] px-[3cqw] shadow-md" style={{ background: c.background }}>
        {dark && <img src={dark} alt="" className="h-[8cqw] w-auto" />}
        <span style={{ fontFamily: `var(${font.variable})`, fontSize: '3.6cqw', color: c.ink }}>{name}</span>
      </div>
    </div>
  );
}
```

`slides/social-slide.tsx`:
```tsx
'use client';
/* eslint-disable @next/next/no-img-element */
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import type { PaletteColor } from '../../types';

export function SocialSlide({ markUrl, palette, name, tagline }: { markUrl: string; palette: PaletteColor[]; name: string; tagline?: string }) {
  const c = Object.fromEntries(palette.map(p => [p.role, p.hex])) as Record<PaletteColor['role'], string>;
  const onPrimary = useRecoloredMark(markUrl, c.background);
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: c.background }}>
      <div className="h-[22cqw]" style={{ background: c.secondary }} />
      <div className="-mt-[8cqw] flex items-end gap-[2cqw] px-[5cqw]">
        <div className="flex h-[16cqw] w-[16cqw] items-center justify-center rounded-full border-[0.8cqw]" style={{ background: c.primary, borderColor: c.background }}>
          {onPrimary && <img src={onPrimary} alt="" className="h-[9cqw] w-auto" />}
        </div>
        <div className="pb-[1cqw]">
          <div style={{ fontSize: '3.4cqw', color: c.ink }} className="font-semibold">{name}</div>
          <div style={{ fontSize: '2.4cqw', color: c.ink }} className="opacity-70">@{name.toLowerCase().replace(/[^a-z0-9]/g, '')}</div>
        </div>
      </div>
      {tagline && <p style={{ fontSize: '2.8cqw', color: c.ink }} className="px-[5cqw] pt-[2cqw]">{tagline}</p>}
    </div>
  );
}
```

`slides/voice-slide.tsx`:
```tsx
import type { PaletteColor } from '../../types';

export function VoiceSlide({ tagline, story, palette }: { tagline: string; story: string; palette?: PaletteColor[] }) {
  const c = Object.fromEntries((palette ?? []).map(p => [p.role, p.hex])) as Partial<Record<PaletteColor['role'], string>>;
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[3cqw] px-[8cqw]" style={{ background: c.background ?? '#ffffff', color: c.ink ?? '#111111' }}>
      <span style={{ fontSize: '6cqw' }} className="font-semibold leading-tight">{tagline}</span>
      <span style={{ fontSize: '2.8cqw' }} className="opacity-75">{story}</span>
    </div>
  );
}
```

`slides/vector-slide.tsx`:
```tsx
/* eslint-disable @next/next/no-img-element */
import { Download } from 'lucide-react';

export function VectorSlide({ svgUrl, name }: { svgUrl: string; name: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[length:4cqw_4cqw] bg-[linear-gradient(45deg,#f1f1f1_25%,transparent_25%,transparent_75%,#f1f1f1_75%),linear-gradient(45deg,#f1f1f1_25%,transparent_25%,transparent_75%,#f1f1f1_75%)] bg-[position:0_0,2cqw_2cqw]">
      <img src={svgUrl} alt="Vector mark" className="h-[55%] w-auto" />
      <a href={svgUrl} download={`${name}-mark.svg`} target="_blank" rel="noreferrer"
        className="absolute bottom-[3cqw] right-[3cqw] flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs text-white">
        <Download className="h-3 w-3" /> SVG
      </a>
    </div>
  );
}
```

- [ ] **Step 6: Wire the row** — replace `src/features/studio/components/direction-row.tsx` with:

```tsx
'use client';

import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlideFrame } from './slide-frame';
import { SlidePlaceholder } from './slide-placeholder';
import { SlideFeedback } from './slide-feedback';
import { MarkSlide } from './slides/mark-slide';
import { LockupSlide } from './slides/lockup-slide';
import { StickerSlide } from './slides/sticker-slide';
import { AppIconSlide } from './slides/app-icon-slide';
import { TypographySlide } from './slides/typography-slide';
import { ColorSlide } from './slides/color-slide';
import { BusinessCardSlide } from './slides/business-card-slide';
import { SocialSlide } from './slides/social-slide';
import { VoiceSlide } from './slides/voice-slide';
import { VectorSlide } from './slides/vector-slide';
import { stageLabel } from '../stage-label';
import { GENERATE_COSTS, type GenerateKind, type PaidSlideKind, type StudioDirection } from '../types';

const PAID: { kind: PaidSlideKind; label: string }[] = [
  { kind: 'color', label: 'Color palette' },
  { kind: 'voice', label: 'Voice' },
  { kind: 'vector', label: 'Vector file' },
];

export function DirectionRow({ direction, brandName, collapsed, onPick, onVariations, onGenerate, busy }: {
  direction: StudioDirection;
  brandName: string;
  collapsed: boolean;
  onPick: () => void;
  onVariations: () => void;
  onGenerate: (kind: GenerateKind, feedback?: { chips: string[]; note?: string }) => void;
  busy: (kind: GenerateKind) => boolean;
}) {
  const { status, concept, markUrl, fontName, picked, slides = {} } = direction;
  const ready = status === 'ready' && !!markUrl;
  const frame = ready ? 'ready' : 'loading';
  const progress = stageLabel(direction);
  const palette = slides.color?.status === 'ready' ? slides.color.palette : undefined;
  const voice = slides.voice?.status === 'ready' ? slides.voice : undefined;
  const fb = (kind: 'mark' | 'lockup' | 'color' | 'voice') => <SlideFeedback kind={kind} onApply={f => onGenerate(kind, f)} />;

  if (status === 'failed') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{concept?.idea ? `“${concept.idea}” couldn't be drawn` : "This direction couldn't be generated"}; its credits were refunded.</span>
        <Button size="sm" variant="outline" onClick={() => onGenerate('mark')} disabled={busy('mark')}>
          {busy('mark') ? <Loader2 className="h-3 w-3 animate-spin" /> : `Retry · ${GENERATE_COSTS.mark} credits`}
        </Button>
      </div>
    );
  }

  return (
    <section className={cn('space-y-3 transition-opacity', collapsed && 'opacity-50 hover:opacity-100')}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm">{concept?.idea ?? ' '}</p>
          {progress && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{progress}</p>}
        </div>
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
        <SlideFrame status={frame} caption={concept?.captions.mark} overlay={fb('mark')}>{markUrl && <MarkSlide markUrl={markUrl} />}</SlideFrame>
        <SlideFrame status={frame} caption={concept?.captions.lockup} overlay={fb('lockup')}>{markUrl && <LockupSlide markUrl={markUrl} name={brandName} fontName={fontName} />}</SlideFrame>
        <SlideFrame status={frame} caption={concept?.captions.inUse ?? 'On a laptop'}>{markUrl && <StickerSlide markUrl={markUrl} />}</SlideFrame>
        <SlideFrame status={frame} caption="App icon">{markUrl && <AppIconSlide markUrl={markUrl} name={brandName} color={palette?.find(p => p.role === 'primary')?.hex} />}</SlideFrame>
        <SlideFrame status={frame} caption="Typography" overlay={fb('lockup')}>{markUrl && <TypographySlide name={brandName} fontName={fontName} sample={concept?.typeSample} />}</SlideFrame>
        {ready && palette && <SlideFrame status="ready" caption="Color" overlay={fb('color')}><ColorSlide markUrl={markUrl!} palette={palette} /></SlideFrame>}
        {ready && palette && <SlideFrame status="ready" caption="Business card"><BusinessCardSlide markUrl={markUrl!} palette={palette} name={brandName} fontName={fontName} /></SlideFrame>}
        {ready && palette && <SlideFrame status="ready" caption="Social profile"><SocialSlide markUrl={markUrl!} palette={palette} name={brandName} tagline={voice?.tagline} /></SlideFrame>}
        {ready && voice && <SlideFrame status="ready" caption="Voice" overlay={fb('voice')}><VoiceSlide tagline={voice.tagline!} story={voice.story!} palette={palette} /></SlideFrame>}
        {ready && slides.vector?.status === 'ready' && <SlideFrame status="ready" caption="Vector"><VectorSlide svgUrl={slides.vector.svgUrl!} name={brandName} /></SlideFrame>}
        {ready && PAID.filter(p => slides[p.kind]?.status !== 'ready').map(p => (
          <SlidePlaceholder
            key={p.kind}
            label={p.label}
            cost={GENERATE_COSTS[p.kind]}
            state={slides[p.kind]?.status === 'pending' || busy(p.kind) ? 'pending' : slides[p.kind]?.status === 'failed' ? 'failed' : 'idle'}
            onGenerate={() => onGenerate(p.kind)}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Pass handlers through** — `round-block.tsx`: add props `onGenerate: (directionId: string, kind: GenerateKind, feedback?: { chips: string[]; note?: string }) => void; isBusy: (directionId: string, kind: GenerateKind) => boolean` and pass `onGenerate={(k, f) => onGenerate(d.id, k, f)}` and `busy={k => isBusy(d.id, k)}` to each `DirectionRow` (import `type GenerateKind` from `../types`). In `studio-client.tsx`:

```tsx
import { useSlideRequest } from '@/features/studio/hooks/use-slide-request';
// inside StudioClient:
  const slides = useSlideRequest(brandId);
// replace the creditError paragraph condition with:
      {(creditError ?? slides.creditError) && (
        <p className="text-sm text-muted-foreground">{creditError ?? slides.creditError} <Link href="/credits" className="underline">Get credits</Link></p>
      )}
// add to <RoundBlock …>:
          onGenerate={slides.request}
          isBusy={(id, kind) => !!slides.busy[`${id}:${kind}`]}
```

- [ ] **Step 8: Verify** — `npm run typecheck && npm run lint && npm test`. Manual on `localhost:3001` (emulators, signed in): open an existing Studio brand with a ready direction:
  1. While a round loads, each row shows "Writing the idea…" then "Drawing the mark with …". A new round shows separate Laptop sticker (full-bleed laptop), App icon, and Typography slides; the typography headline is brand-written, not the name.
  2. Dashed placeholders Color / Voice / Vector appear at the right with costs; **Generate Color** → spinner → Color, Business card, Social profile slides appear; the mark is recolored, shape unchanged; balance −5.
  3. **Generate Voice** → tagline + story slide; Social profile shows the tagline; −2.
  4. **Generate Vector** → SVG slide with a working download link; −5.
  5. Hover the mark → "Feedback" → pick *simpler* → **Redo this slide · 5 credits** → row shows progress, then a new mark; the Vector slide returns to a placeholder.
  6. Hover the lockup → *different font* → free; the font changes.
  7. Double-click a Generate button → one charge.

- [ ] **Step 9: Commit**

```bash
git add src/features/studio "src/app/studio/[brandId]/studio-client.tsx"
git commit -m "feat(studio): placeholder slides, color/voice/vector/mockup slides, slide feedback, retry, progress text

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Docs

- [ ] **Step 1:** In `claude.md` "Studio (new brand flow)" add: "Phase 4: `generateSlide` (color 5, voice 2, vector 5, mark redo 5, lockup font free) via `src/ai/studio/request-slide.ts` + `run-slide.ts`; color = Claude palette + exact browser recolor (`src/lib/recolor.ts`); slide feedback chips in `SLIDE_FEEDBACK_CHIPS`; sweep also refunds stuck slides." In `docs/SPEC.md` "Fixed during this session", add a row: "Old editor colorize uses `fal-ai/reve/fast/remix`, which no longer exists on fal — still broken in the legacy editor; Studio uses palette + recolor instead."
- [ ] **Step 2: Commit**

```bash
git add claude.md docs/SPEC.md
git commit -m "docs: Studio phase 4 slides and feedback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
