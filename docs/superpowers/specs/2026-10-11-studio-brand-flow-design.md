# Studio: visual, collaborative brand flow — design

**Date:** 2026-10-11 · **Status:** awaiting owner review · **Replaces (eventually):** onboarding form → `/brands/[id]` editor → `/brands/[id]/presentation`

## 1. Intent

**Problem (owner's words, summarized):** the current flow is form → editor → presentation. It takes too long to see a good result, the output is text-heavy and looks poor, and there's little opportunity to steer or give feedback.

**Goal:** one page where a user quickly sees *visual* brand directions, reacts to them, and steers. Mostly images, very little text.

**Success criteria**
- First visual (a mark) visible within ~15s of submitting the start screen.
- The user never fills a free-text form beyond name + one sentence.
- Every slide can receive targeted feedback.
- The system learns which kinds of directions get picked, per segment, from day one.

## 2. Decisions made with the owner

| Topic | Decision |
|---|---|
| Overall concept | **B — three directions, then narrow.** Each round shows 3 directions as stacked horizontal rows. |
| Start input | Name + one sentence. Audience and style are **preset tags**; **Jev** (`typesafe-ai/jev` via Vercel AI Gateway) pre-selects likely tags; user can only pick from presets. |
| How directions differ | All three axes at once: **idea type**, **style leaning**, **model** — tracked so we learn what works. |
| Learning | **Auto-balance from day one** (Thompson-sampling bandit) + a simple stats view. |
| Going deeper | User chooses what to generate next, via **dashed placeholder slides** at the right of the row, each with a Generate button. |
| Cost rule | Cheap things (browser renders, Jev decisions) generate **immediately, free**. Anything calling an image model or Claude **costs credits** (cost shown on the button). |
| Feedback | Hover any slide → feedback icon ("Click to give feedback") → slide-specific chips + optional note → regenerate that slide. |
| Presenting | Every row has a **full-screen Present** mode (arrows/swipe, Esc, Share, PDF). |

## 3. User flow

1. **Start screen** (`/studio/new`): brand name + one sentence. On blur/debounce, Jev scores the preset tags; top matches are pre-selected (≈ p ≥ 0.6, max 3 per group). User adjusts → **Show me 3 directions**.
2. **Round** appears at the top of `/studio/[brandId]`: 3 rows, each starting with skeleton frames that fill in progressively (concept → mark → free slides).
3. **Pick** a direction: it stays expanded; the other two collapse to thumbnail strips (re-openable).
4. **Go deeper** by clicking Generate on any dashed placeholder at the right of a row.
5. **Feedback** on any slide → regenerate that slide.
6. **New directions** (optional chips: *more playful · less literal · bolder · simpler*, or "variations on this" seeded from a picked row) → a new round of 3 at the top; older rounds move down as history.
7. **Present** a row full screen; Share / PDF from there.

## 4. Slides

Each row = generated slides (left) + dashed placeholders for not-yet-generated slides (right).

| Slide kind | Produced by | Cost | When |
|---|---|---|---|
| `mark` | fal image model (per recipe) | included in round | with the round |
| `lockup` (mark + name) | browser render; Jev picks a font from `BRAND_FONTS` | free | auto, once mark exists |
| `in-use` (sticker, app icon, light/dark) | browser render (existing sticker/mockup code) | free | auto |
| `typography` (heading/body specimen) | Jev picks pairing; browser render | free | auto |
| `color` (palette + color version of mark) | fal recolor + palette extraction (+ Claude names) | credits | on Generate |
| `mockups` (business card, social profile, signage) | browser render | free | auto once `color` exists |
| `voice` (tagline + one-line story) | Claude | credits (small) | on Generate |
| `vector` (SVG download) | fal vectorize | credits | on Generate |

**Feedback chips per slide kind**
- mark: *simpler · bolder · less literal · different shape · thinner lines*
- lockup: *different font · tighter · name larger*
- color: *warmer · cooler · more muted · more vivid*
- voice: *shorter · more playful · more serious*
- (others: optional note only)

**Visual style:** 16:9 frames everywhere; one idea per slide; captions ≤12 words in small type below the frame; big mark with generous whitespace; brand palette as slide backgrounds once `color` exists. Slides size with **CSS container queries** on the frame so a slide looks identical in the row, full-screen, and PDF (fixes current `cqw`-without-container bug).

## 5. Architecture

- **New route** `/studio/[brandId]` (+ `/studio/new`), built alongside existing pages. The old editor/presentation remain until Studio replaces them (separate decision).
- **Server actions** (all: verify ID token + brand ownership):
  - `suggestTags(name, pitch)` → one Jev `/v1/evaluate` call with one boolean question per preset tag.
  - `createStudioBrand(name, pitch, audienceTags, styleTags)` → brand doc.
  - `startRound(brandId, { feedbackChips?, seedDirectionId? }, clientRoundId)` → charges credits (Admin SDK transaction), writes round + 3 `pending` directions, returns; work continues in Next `after()`.
  - `generateSlide(directionId, kind, { feedback? }, clientRequestId)` → charges (if paid), writes `pending` slide, continues in `after()`.
  - `recordEvent(directionId, type)` → picked / presented / downloaded / shared.
- **Background work** (in `after()`, per direction in parallel): Claude writes concept + captions (structured, constrained by recipe) → fal renders mark (via `src/ai/logo-models.ts`) → **server uploads to R2** → updates the direction doc. No browser round-trip of image data.
- **Client** subscribes to round/direction docs with Firestore listeners; UI fills in as statuses change.
- **Credits:** server-only writes. Firestore rules forbid client writes to `userProfiles.balance/totalUsed/totalPurchased` and `transactions`. Failed steps are **refunded** automatically.
- **Idempotency:** client generates `clientRoundId` / `clientRequestId`; server ignores duplicates (prevents double charges from double clicks/re-renders).

### Data model (under `users/{uid}/brands/{brandId}`)

```
brand doc              + audienceTags[], styleTags[], source: 'studio'
rounds/{roundId}       createdAt, feedbackChips[], seedDirectionId?, segment
directions/{id}        roundId, order, recipe{ideaType, styleLean, model},
                       concept{idea, rationale}, picked, pickedAt,
                       slides: { [kind]: {status, imageUrl?, data?, caption?, error?} },
                       feedback: [{slideKind, chips[], note?, createdAt}]
```

### Learning loop (server-only collections)

- **Recipe** = `{ideaType ∈ [literal-symbol, abstract-geometric, lettermark, negative-space], styleLean ∈ user's chosen style tags, model ∈ LOGO_MODELS}`.
- `recipeStats/{segment}__{ideaType}__{model}`: `shown, picked, deeper, downloaded`. (styleLean is user-specific, so it's logged on events but not a stats key.)
- `events/{id}`: raw log (round shown, picked, slide generated, feedback given, presented, downloaded).
- **Slot selection:** for each candidate recipe sample `Beta(picked+1, shown−picked+1)`; take the best 3 subject to **diversity** (3 different models and 3 different idea types). Style leans assigned round-robin across the user's style tags.
- **Segment** = top style tag + top audience tag; fall back to `global` until the segment has ≥30 rounds.
- **Stats page** `/studio/stats` (owner-only via an allowlisted UID in env) showing pick rate per recipe per segment.

## 6. Credits (initial; constants in `src/lib/credits.ts`)

| Action | Credits |
|---|---|
| Round of 3 directions | 15 |
| `color` slide | 5 |
| `voice` slide | 2 |
| `vector` slide | 5 |
| Regenerate mark with feedback | 5 |
| Regenerate paid slide with feedback | same as the slide |
| Free slides, tag suggestions, regenerate free slide | 0 |

## 7. Errors

- Per-slide `status: pending | ready | failed`; failed slides show **Retry** and are refunded.
- Timeouts: 60s on fal, 45s on Claude, 10s on Jev; `maxDuration` set on the Studio route.
- Jev failure → no pre-selection (tags still pickable); never blocks the flow.
- Insufficient credits → Generate buttons show the shortfall and link to `/credits`; nothing is charged.
- Model failure in one direction never fails the other two.

## 8. Testing

- **Unit (Vitest):** bandit sampling + diversity constraint; segment fallback; tag-threshold selection; credit cost table; Jev response parsing; recipe → prompt building.
- **Rules tests** against the Firestore emulator (`@firebase/rules-unit-testing`): clients cannot write balances, transactions, `recipeStats`, `events`; owners can read their rounds/directions.
- **Server-action integration** against emulators with fal/Claude/Jev stubbed: charge → pending docs → ready docs; failure → refund; duplicate `clientRoundId` → single charge.
- **Manual E2E** in the browser pane using the emulator test account (`scripts/emulator-test-user.json`) with real fal/Claude/Jev.

## 9. Build order (each phase ships something usable)

1. **Tags + start screen:** preset tag lists, `suggestTags` (Jev), `/studio/new`, `createStudioBrand`.
2. **Server-side rounds:** credits/refunds/idempotency on the server, rules lock-down, `startRound` with concept + mark per direction (random recipe for now), R2 server upload.
3. **Studio page:** rounds as rows, progressive rendering, pick/collapse, free auto slides (lockup, in-use, typography).
4. **Paid slides + feedback:** dashed placeholders with Generate, `color` / `voice` / `vector`, per-slide feedback popover + regenerate.
5. **Learning loop:** events, `recipeStats`, Thompson-sampling slot selection, stats page.
6. **Present + share:** full-screen mode, Share link, PDF.

## 10. Out of scope (for now)

- Retiring the old editor/presentation routes and migrating existing brands.
- Real payments (credits remain the gate; purchase flow unchanged).
- Wordmark-only/typographic logos (the mark is an icon; the name is set in a font).

## 11. Existing groundwork this builds on (already in the working tree)

- `src/ai/logo-models.ts` — Recraft V4.1 / GPT Image 1.5 / Nano Banana Pro with black-on-white enforcement (tested).
- Firebase emulators + local dev login (`npm run emulators`, `npm run dev:local`).
- `AI_GATEWAY_API_KEY` in `.env`; Jev verified (≈225 ms, ≈$0.000015 per 4 questions).
