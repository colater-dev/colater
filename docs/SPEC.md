# Colater — Current-State Spec

> **What this is:** a description of what the code *actually does* as of 2026-10-11 (HEAD `ba35bf9` + uncommitted changes), reverse-engineered by reading the source. Where `claude.md` or other docs disagree, this document follows the code.
>
> **Part 1** describes behavior. **Part 2** lists problems, prioritized, as the starting backlog for cleanup.

---

# Part 1 — What the app does

## 1. Product in one paragraph

Colater is a Next.js 16 / React 19 web app where a signed-in user (Google via Firebase Auth) describes a brand (name, pitch, audience, style cues). The app then uses Claude to write a logo concept, fal.ai image models to generate black-and-white logos, and further AI steps to colorize, critique, and vectorize them. The editor renders the logo as lock-ups, stickers, mockups and palettes; can generate an 8-slide client presentation (exportable to PDF, shareable by link); and exposes brand data to external tools through API keys + an MCP server package. AI actions cost **credits** (50 free on signup, "purchasable" via a mock checkout).

## 2. Stack as actually used

| Layer | Reality |
|---|---|
| Framework | Next.js 16.1.1 (App Router, Turbopack), React 19, TypeScript strict |
| UI | Tailwind 3.4, shadcn/ui (Radix), framer-motion 11 **and** motion 12 |
| Auth | Firebase Auth, Google only (popup with redirect fallback). `next-auth` is installed but **unused**. |
| Data | Firestore via the **client SDK** for almost everything; Admin SDK only in server actions (auth check, `purchaseCredits`) and API routes |
| Text AI | Genkit 1.28 with **only the Anthropic plugin**; model `anthropic/claude-sonnet-4-5-20250929` everywhere |
| Image AI | fal.ai only: `nano-banana-pro`, `reve/text-to-image`, `ideogram/v3`, `reve/fast/remix` (colorize), `recraft/vectorize` |
| Storage | Cloudflare R2 for all new media. Firebase Storage is read-only legacy (nothing writes to it). |
| Errors | Sentry (server/edge wired; client config likely never loaded under Turbopack) + React error boundaries |
| Tests | Vitest, 150 tests across 6 files (pure utils + validation schemas only) |
| CI | GitHub Actions: typecheck, lint, test (no build) |

## 3. Route map

| Route | Auth | Purpose |
|---|---|---|
| `/` | none | Landing page (`landing-page-client.tsx`): hero, features, Google sign-in CTA |
| `/onboarding` | — | Server redirect to `/` |
| `/onboarding/steps/{name,pitch,audience,style}` | **none** | Guided brand input, state in `localStorage` |
| `/onboarding/steps/review` | `useRequireAuth` | Creates the brand in Firestore |
| `/onboarding/generating` | none | ~3.5s fake progress animation → `/brands/{id}?new=true` |
| `/dashboard` | `useRequireAuth` | Brand grid; card click → **presentation**, hover "Editor" → editor |
| `/brands/new` | `useRequireAuth` | Form-based brand creation with AI "brainstorm" / "fill for me" |
| `/start-from-image` | `useRequireAuth` | Upload an existing logo + type brand details |
| `/brands/[brandId]` | none (shows "Brand Not Found" if signed out) | **Brand editor** (the core of the app) |
| `/brands/[brandId]/logos/[logoId]` | public | Shared logo page + star-rating feedback |
| `/brands/[brandId]/presentation` | none (infinite spinner if signed out) | 8-slide presentation editor, PDF export, share link |
| `/brands/[brandId]/settings` | `useRequireAuth` | Tabs: API keys, Integrations (MCP wizard + playground), General (stub) |
| `/p/[shareToken]` | public | Public presentation viewer (**currently broken**, see P0) |
| `/taglines` | `useRequireAuth` | Generate / star / edit / hide taglines per brand |
| `/ranker` | auth | Rate all your logos 1–5 + feedback (**query likely denied by rules**, see P1) |
| `/credits` | `useRequireAuth` | Balance, mock purchase packs, cost table, transaction history |
| `POST /api/mcp/brands/{context,list}`, `/api/mcp/assets/get`, `/api/mcp/voice/validate` | API key or Firebase ID token | External brand API (**currently returns no data**, see P0) |
| `GET/POST /api/brands/[brandId]/api-keys`, `DELETE …/[keyId]` | Firebase ID token | API key management |
| `GET /api/images/search` | none | Unsplash proxy — **no caller** |

Global chrome: `AppHeader` (logo, brand switcher, credit pill, user menu) and `AppSidebar` (Logo → `/dashboard`, Tagline → `/taglines`) render on **every** route, including landing and onboarding.

## 4. User journeys

### 4.1 Sign-in
- `initiateSmartGoogleSignIn` ([non-blocking-login.tsx](../src/firebase/non-blocking-login.tsx)): popup; on blocked/closed popup, falls back to full-page redirect.
- After popup sign-in the user **stays on `/`** (CTA becomes "Create Your Brand"). After redirect sign-in, the landing page routes to `/onboarding/steps/name`.
- No middleware: all route protection is client-side redirects.

### 4.2 Creating a brand — three divergent flows

| | Onboarding | `/brands/new` | `/start-from-image` |
|---|---|---|---|
| Entry point | Landing CTA only | Dashboard buttons / empty state | Dashboard card (only once ≥1 brand exists) |
| Name rule | 1–50, `[a-zA-Z0-9 -&]` | ≥2 chars | ≥2 chars |
| Audience | 5–200 chars (+4 AI suggestions) | ≥10 chars | optional → "General audience" |
| Cues | Pick from fixed pill lists | Free text | Free text |
| AI helpers | Audience suggestions (free) | Brainstorm from topic, "Fill everything else" (free) | none |
| Font | `'Inter'` (not a real brand font) | Random from chosen category | `'Inter'` |
| Logo | — | — | Uploaded to R2, set as `brand.logoUrl` |
| Lands on | `/brands/{id}?new=true` (tutorial modal) | `/brands/{id}` | `/brands/{id}` |

All three write `users/{uid}/brands/{autoId}` = `{userId, createdAt, latestName, latestElevatorPitch, latestAudience, latestDesirableCues, latestUndesirableCues, font}`.

### 4.3 Brand editor (`/brands/[brandId]`) — the core loop

Implemented in [brand-detail-client.tsx](../src/app/brands/[brandId]/brand-detail-client.tsx) (state + all handlers) → `BrandIdentityCard` (layout, display settings) → `BrandIdentityHeader` (toolbar), `LogoShowcase` (all tiles), `BrandApplications` (mockups), `LogoNavigationDock` (thumbnail dock).

**Automatic on page load:**
1. If the brand has no `latestConcept` → generate one (**charges 3 credits**). Now runs at most once per page load (fixed this session).
2. Once a concept exists and the brand has zero logos → fire **two** logo generations in parallel (nano-banana + reve, **20 credits**). This also happens for start-from-image brands whose logo lives on the brand doc, not in `logoGenerations`.
3. Every time the (unfiltered) logo count is even, regenerate the concept in the background (**free**, overwrites `latestConcept`).
4. Whenever the viewed logo changes, write `brand.logoUrl` + `brand.displaySettings` from it.

**User actions (all charge credits client-side *before* the AI call, no refund on failure):**

| Action | Credits | Server action → AI | Result written |
|---|---|---|---|
| Generate Brand Concept | 3 | `getLogoConcept` → Claude | `brand.latestConcept` = `concept + "\n\nStyle Prompt: " + stylePrompt` (never shown in UI) |
| Generate Logo | 10 | `getLogoSuggestionFal` / `getLogoSuggestion` / `getLogoSuggestionOpenAI` → fal (+ Claude for prompt when no concept) | data URI → R2 upload → new `logoGenerations` doc |
| Colorize (Generate Color Version) | 5 | `getColorizedLogo` → fal `reve/fast/remix` + get-image-colors + Claude color names | appends to `colorVersions[]` and overwrites legacy `colorLogoUrl`/`palette` |
| Critique | 3 | `convertUrlToDataUri` → `getLogoCritique` → Claude vision | `logo.critique` |
| Download SVG | 5 | `getVectorizedLogo` → fal `recraft/vectorize` | `logo.vectorLogoUrl`, auto-downloads |
| Share | free | — | copies private logo (and, first time, the whole brand doc) to public `brands/{id}/logos/{id}`; copies URL |
| Edit name/pitch, font, display settings, crop, external media, delete logo (soft), delete color version | free | — | direct Firestore writes |

**Provider picker** (UI label → what actually runs):

| Label | Runs |
|---|---|
| Nano Banana Pro (default) | `fal-ai/nano-banana-pro` |
| Ideogram v3 | `fal-ai/ideogram/v3` 720² |
| Reve | `fal-ai/reve/text-to-image` |
| **Gemini** | `fal-ai/ideogram/v3` (not Gemini) |
| **OpenAI** | `fal-ai/ideogram/v3` 512² (not OpenAI) |

**What the showcase renders:** horizontal + vertical lock-ups (logo + brand name in chosen font, with spacing/balance/contrast/invert/text-transform controls and reveal animations), external media panel, B&W / color / "direct" stickers (client-side distance-transform effect), T-shirt, light/dark tiles, an "on brand color" tile per palette color, per-color-version tiles with hue slider, business cards / app icon / social profile mockups, 5-shade palette grid, and critique pins. PNG export via `html-to-image`.

### 4.4 Logo share page (`/brands/[brandId]/logos/[logoId]`)
Reads the public copy (falls back to the owner's private doc if signed in), renders `BrandIdentityCard` read-only, plus a 5-star + comment feedback form writing to `brands/{id}/logos/{id}/feedback`. Nothing reads that feedback.

### 4.5 Taglines (`/taglines`)
Generate 3 taglines via Claude (**not charged**, despite a 2-credit cost being defined), star one (sets `status: liked`, does **not** set `brand.primaryTagline`), inline edit, "delete" = hide (`status: disliked`).

### 4.6 Ranker (`/ranker`)
Collection-group query of all the user's logos; set 1–5 rating + feedback text per logo (`logo.rating`, `logo.feedback`). Intended to feed prompt improvement; nothing consumes it.

### 4.7 Presentation (`/brands/[brandId]/presentation`)
- First visit with no presentation: charges **5 credits**, calls `getPresentationNarrative` (Claude) and builds 8 slides: cover, challenge, solution, logo-reveal, visual-identity, color-story, applications, next-steps. If the AI fails, saves fallback text silently (credits kept).
- Inline `contentEditable` editing; persisted only on **Save**. Keyboard navigation. PDF export (hidden off-screen render → `html-to-image` → jsPDF).
- Share: generates a `Math.random` token, sets `isPublic`, writes `public_presentations/{token}` → URL `/p/{token}`.
- Dashboard card clicks land here, so simply opening a brand from the dashboard can cost 5 credits.

### 4.8 Settings, API keys, MCP
- **API keys:** `colater_sk_brand_{brandId}_{32 hex}`; SHA-256 hash stored at `users/{uid}/brands/{brandId}/apiKeys/{id}` with permissions preset (owner = all; team = read+validate; developer = read+generate). Soft revoke.
- **Integrations tab:** 3-step Claude Desktop config wizard, live API playground (uses the user's Firebase ID token), code snippets.
- **MCP API:** 4 POST endpoints returning brand context, brand list, assets (logo/colors/fonts in hex/rgb/hsl/tailwind/css/figma), and voice validation.
- **`colater-mcp/`:** standalone stdio MCP server package (`@colater/mcp-server`) that proxies those 4 endpoints. Not built, not published, not in CI.

### 4.9 Credits
- Costs ([credits.ts](../src/lib/credits.ts)): logo 10, colorize 5, vectorize 5, presentation 5, critique 3, concept 3, tagline 2*, brand completion 3*, brand suggestions 3* (*defined but never charged).
- New users: 50 credits, auto-initialized client-side by `useCredits` (mounted in the header on every page).
- Deduction: browser-side Firestore transaction in `CreditsService.deductCredits`, then a ledger entry written outside the transaction.
- "Purchase": `purchaseCredits` server action (Admin SDK) adds credits — **no payment provider**.
- Uncommitted: a "+" header button that adds 10 free credits client-side, enabled by an uncommitted rules change.

## 5. AI layer

All flows in [src/ai/flows/](../src/ai/flows/), all server actions in [src/app/actions.ts](../src/app/actions.ts). Every action takes an `idToken` first and calls `requireServerAuth` (verifies identity only — no ownership or credit checks). Return shape: `{success, data?, error?}`.

| Flow | Model | Server action | Called from |
|---|---|---|---|
| generateLogoConcept | Claude Sonnet 4.5 | getLogoConcept | brand editor (charged + free background) |
| generateLogoFal | fal (client-chosen model id) + Claude | getLogoSuggestionFal, getLogoSuggestion | brand editor |
| generateLogoOpenAI | fal Ideogram v3 + Claude (misnamed) | getLogoSuggestionOpenAI | brand editor |
| colorizeLogo | fal reve/fast/remix + get-image-colors + Claude | getColorizedLogo | brand editor |
| vectoriseLogo | fal recraft/vectorize | getVectorizedLogo | brand editor |
| critiqueLogo | Claude vision | getLogoCritique | brand editor |
| generatePresentationNarrative | Claude | getPresentationNarrative | presentation |
| generateTaglines | Claude | getTaglineSuggestions | /taglines |
| generateBrandDetails | Claude | getBrandSuggestions | /brands/new |
| completeBrandDetails | Claude | getBrandCompletion | /brands/new |
| generateAudienceSuggestions | Claude (silent canned fallback) | getAudienceSuggestions | onboarding |
| — | Admin Firestore | purchaseCredits | /credits |
| generateStories, generatePresentationData, justifyLogo | Claude | getGeneratedStories, getPresentationData, getLogoJustification | **unused** |
| generateLogo | `googleai/gemini-3-pro-image-preview` (**plugin not registered**) | — | **unused** (dev.ts only) |
| (route) voice validate | `googleai/gemini-3-flash-preview` (**plugin not registered**) | — | /api/mcp/voice/validate |

**Image persistence pipeline:** provider URL → server fetches → base64 data URI returned to browser → browser sends it back to the `uploadDataUriToR2` server action → R2 key `logos/{uid}/{uuid}.{ext}` → browser writes the R2 URL to Firestore. External media uses `getPresignedUploadUrl` → browser PUT → `uploads/{uuid}.{ext}`.

## 6. Data model (as written by code)

```
users/{uid}
  brands/{brandId}
      userId, createdAt, latestName, latestElevatorPitch, latestAudience,
      latestDesirableCues, latestUndesirableCues, font,
      latestConcept, logoUrl, displaySettings
      (primaryTagline: read everywhere, written nowhere)
    logoGenerations/{logoId}
      id, brandId, userId, logoUrl, prompt, concept, createdAt, isPublic, font,
      displaySettings{textTransform, showBrandName, invertLogo, logoContrast,
                      horizontal/verticalLogoTextGap, horizontal/verticalLogoTextBalance},
      colorVersions[{colorLogoUrl, palette}], colorLogoUrl*, palette*   (*legacy, still written)
      critique{overallSummary, points[{id,x,y,comment,sentiment}]},
      vectorLogoUrl, externalMediaUrl, cropDetails{x,y,width,height},
      isDeleted, rating, feedback
    taglineGenerations/{id}   brandId, userId, tagline, createdAt, status
    presentations/{id}        id, brandId, userId, version, isPublic, viewCount, slides[], shareToken, lastEdited, createdAt
    apiKeys/{id}              userId, brandId, name, keyHash, keyPrefix, permissions{read,validate,generate,modify},
                              createdAt, expiresAt, lastUsedAt, usageCount, revokedAt
userProfiles/{uid}            balance, totalPurchased, totalUsed, updatedAt
  transactions/{id}           userId, amount, balance, action, description, createdAt
brands/{brandId}              public snapshot copy of the private brand doc (made on first share)
  logos/{logoId}              public snapshot copy of a logo (made on share)
    feedback/{id}             logoId, brandId, rating, comment, isAnonymous, authorName?, authorId?, createdAt
public_presentations/{token}  userId, brandId, presentationId, createdAt
```

Types declared in [types.ts](../src/lib/types.ts) but never written: `colorNames`, `critiqueFeedback`, `presentationData`, `justification`, `sharePassword`, `expiresAt`/`lastViewed` on presentations.

## 7. Security model today

- **Firestore rules** ([firestore.rules](../firestore.rules)): owner-only under `users/{uid}/**`; `userProfiles` owner create/update (balance protected in the committed version, **unprotected** in the uncommitted one); public read on `brands/**`; `feedback` create/read open to everyone unauthenticated; `public_presentations` creatable by any signed-in user with any content; unused `public_presentations_lookup` rule. No collection-group rule for `logoGenerations`. No `firestore.indexes.json`.
- **Storage rules:** cover Firebase Storage, which is no longer written to.
- **Server:** every server action verifies a Firebase ID token, except `uploadDataUriToR2` and `getPresignedUploadUrl` (no auth at all).

## 8. Configuration

Env vars actually read: `ANTHROPIC_API_KEY` (required — Genkit throws on import without it), `FAL_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `FIREBASE_SERVICE_ACCOUNT_KEY` (or `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`), `NEXT_PUBLIC_FIREBASE_*` (with hardcoded fallbacks; `authDomain` always hardcoded), `UNSPLASH_ACCESS_KEY`, `NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.
Read nowhere despite docs: `GEMINI_API_KEY`, `GOOGLE_GENAI_API_KEY`, `OPENAI_API_KEY` (only by dead `src/ai/openai.ts`).

Deploy target is ambiguous: `apphosting.yaml` (Firebase App Hosting) only declares `GEMINI_API_KEY`, `OPENAI_API_KEY`, `FAL_KEY`; recent commits reference a Vercel build.

## 9. Tooling status (verified 2026-10-11)

- `npm run typecheck` ✅ · `npm run lint` ✅ (with 30 inline `eslint-disable`s, incl. one `rules-of-hooks`) · `npm test` ✅ 150 tests
- `npm run genkit:dev` ❌ (`src/ai/dev.ts` imports deleted `@/lib/storage`) · `npm run genkit:watch` ❌ (path typo `srcai/dev.ts`)
- Local Node is 23.1; `package.json` engines says `>=20 <23`; `.nvmrc` says 22; `.idx/dev.nix` says 20.

---

# Part 2 — Problems (prioritized backlog)

Severity: **P0** = broken core feature or exploitable · **P1** = user-visible bug · **P2** = architecture / maintainability · **P3** = hygiene / docs.

## P0 — Broken or exploitable

1. **Credits are enforced only in the browser.** No server action checks or deducts credits; deduction is a client Firestore transaction. Anyone signed in can call AI server actions directly for free. The committed rules block client balance writes, which makes *every* charge fail ("Insufficient Credits") — the uncommitted rules change "fixes" that by letting users write any balance. → Move check+deduct (and refund-on-failure) into the server actions with the Admin SDK; lock `userProfiles` + `transactions` to server-only writes.
2. **`purchaseCredits` grants credits with no payment.** Prices are display-only. Plus the uncommitted "+10" header button.
3. **Unauthenticated upload server actions.** `uploadDataUriToR2` ([r2-upload.ts](../src/lib/r2-upload.ts)) trusts client-supplied `userId`/`folder`/content type; `getPresignedUploadUrl` ([upload-media.ts](../src/app/actions/upload-media.ts)) mints 1-hour PUT URLs for any content type. Anyone can write arbitrary files (incl. `text/html`) to the public R2 domain.
4. **Client-chosen fal model id.** `getLogoSuggestionFal` passes the client's model string to `fal.subscribe`, so any user can run any fal model on the server's key.
5. **MCP API returns no data for anyone.** All four routes do `const userId = await requireMCPAuth()` but that returns an object → paths become `users/[object Object]/…` → empty list / 404. Introduced in `4ca1dc8`.
6. **MCP permissions and brand scoping are not enforced.** Permission tiers are stored but never checked; the key's `brandId` is never compared with the request's. Once (5) is fixed, any key reads all of the owner's brands.
7. **Public presentation links are broken twice.** `/p/[shareToken]/page.tsx` reads `params` synchronously (a Promise in Next 16) → token is `undefined`. Even with a token, the viewer reads owner-only paths via the client SDK, so anonymous visitors are denied. Needs a server-side (Admin SDK) read of a curated public snapshot.
8a. **"Reve" logo generation always fails:** fal returns 404 `Application "reve" not found` for `fal-ai/reve/text-to-image` (observed 2026-10-11). It's one of the two automatic first-load generations, so every new brand loses 10 credits to it.
8. **Voice validation can never work.** It calls a `googleai/` model but only the Anthropic plugin is registered.
9. **Auto-charging the user doesn't ask for.** Opening a new brand costs 23 credits (concept + 2 logos), including start-from-image brands that already have a logo; opening a brand from the dashboard can cost 5 (presentation). Combined with no refunds, failures burn credits.

## P1 — User-visible bugs

**Brand editor**
10. **No refunds** when any AI call fails (credits deducted before the call). Presentation saves fallback text and keeps the 5 credits.
11. **Edit dialog corrupts the pitch:** "Elevator Pitch" field is pre-filled from `primaryTagline` (i.e. the placeholder "Your tagline will appear here."), and saving writes that into `latestElevatorPitch`.
12. **Index bug after any soft delete:** `setCurrentLogoIndex(logos.length - 1)` uses the unfiltered array while `currentLogo` reads the filtered one → showcase disappears.
13. **Browsing logos rewrites the brand** (`logoUrl`, `displaySettings`), and **display settings leak** from the previous logo onto a logo without settings via the 500 ms debounced save.
14. **Free background concept regeneration** on every even logo count (including page load) silently overwrites the concept.
15. **Concept is never shown or editable**, though a toast promises it is. The "concept + Style Prompt" string is stored as one blob. The concept prompt also contradicts itself (white-on-black vs black-on-white).
16. **Deleting a color version doesn't stick:** legacy `colorLogoUrl`/`palette` keep the deleted version, which reappears via the migration code. "Primary" color version means oldest in some places and newest in others. `colorNames` is dropped on save.
17. **Vectorize charges then fails** when cropping fails (passes an http URL to a data-URI-only upload); the waiting flag never resets.
18. **Critique pins are mispositioned** (image-relative % drawn on the whole card) and the summary is never shown.
19. **Clearing external media is never saved** (stale closure).
20. **Delete-logo dialog stays open** after deleting and now targets the next logo.
21. **Two parallel auto-generations share one loading flag.**
22. **`'Inter'` default font isn't in `BRAND_FONTS`** → invalid CSS `var(sans-serif)` in the editor, Aboreto fallback on the dashboard, empty font select.
23. **Base64 images through server actions** will hit Next's default 1 MB body limit (no `serverActions.bodySizeLimit`) for large logos (inferred, not yet observed).
24. **Hardcoded `image/png`** in `convertUrlToDataUri`; wrong error text ("colorization") in the critique path.

**Sharing / public pages**
25. **Public logo/brand copies are stale snapshots** taken at first share; the full private brand doc (audience, cues, concept) is copied to a world-readable path.
26. **Anonymous feedback always fails** (`undefined` fields without `ignoreUndefinedProperties`); "Sign In to Submit" links to a nonexistent `/login`. Read-only share page still shows edit controls.
27. **Share tokens are weak and unrevokable** (`Math.random`, ~11 chars; `isPublic` never checked; lookup docs undeletable); reopening the Share dialog mints a new token each time.

**Presentation**
28. Infinite spinner when signed out or when the brand has no logos; `getLatestPresentation` has no `orderBy`; `order`/`isVisible` ignored; `cqw` units with no container → sizes follow the viewport; "Use Arrow Keys" on the public page with no key handler; possible double charge (guard set after the await).

**Onboarding / entry**
29. **Audience AI suggestions never run** (effect reads state before localStorage loads).
30. Last ~500 ms of typing can be lost between steps (debounced save cleared on unmount).
31. Name regex rejects "Café Luna" — the step's own placeholder — plus apostrophes and periods.
32. Review step doesn't validate → empty brands possible; back-then-generate creates duplicates; `/onboarding/generating` without `brandId` hangs.
33. Popup sign-in doesn't navigate anywhere; non-popup errors are unhandled rejections.
34. Nested `FirebaseClientProvider` + duplicate `<Toaster/>` in the onboarding layout; three overlapping `fixed top-0 z-50` headers on landing/onboarding.

**Other**
35. **Ranker is likely denied** (no collection-group rule, no index) → throws into the global error boundary. Also shows soft-deleted logos and wipes unsaved feedback on any snapshot.
36. **Any Firestore write error crashes the whole app**: non-permission errors are emitted as `permission-error`, and `FirebaseErrorListener` throws during render in the root layout.
37. Credit initialization races (check-then-set, multiple `useCredits` mounts, `useDoc` starts with `isLoading=false`); three different "missing profile" initializations.
38. API routes return 500 instead of 401 for bad tokens/keys.

## P2 — Architecture & maintainability

39. **God components:** `logo-showcase.tsx` (979 lines), `brand-detail-client.tsx` (~730, 13 handlers + 6 effects, several writing to Firestore), `brand-identity-card.tsx` (663, ~20 state vars). `memo` on children is defeated by inline callbacks.
40. **Service layer is bypassed:** editor, taglines and presentation build Firestore paths inline; `TaglineService` is entirely unused; most `BrandService`/`LogoService` methods unused.
41. **Duplication:** two near-identical logo flows (`generate-logo-fal` / `generate-logo-openai`); fetch→base64 in 5 places; content-crop and background detection twice; legacy color migration ×4 (mutating snapshot arrays); API-key generation/hashing ×3; slide switch ×4; provider mapping split across UI/client/server.
42. **Round-tripping images through the browser:** server fetches provider image → base64 to browser → browser sends it back to server → R2. Should upload server-side and return a URL.
43. **Inconsistent error handling:** mixed result shapes, generic rethrows that hide causes, silent fallbacks (canned audience suggestions, static style prompt, mock Unsplash data with 200, null-cast Admin SDK, empty R2 credentials).
44. **No timeouts** on any fal / Claude / fetch call; no `maxDuration` on routes.
45. Model ids hardcoded in 8+ places; misleading names (`getLogoSuggestion` "Gemini", `generateLogoOpenAI`).
46. Three logo-display state homes (card local state → logo doc → brand doc copy); hue shift, scale, card modes never persisted.
47. Testing covers only pure utilities; no tests for services, server actions, rules, or API routes. No rules tests despite rules being the security boundary.

## P3 — Hygiene & docs

48. **Dead code:** `home-client.tsx` (old landing), `user-chip.tsx`, `BrandHeader` (the only UI that could edit audience/cues), `LogoBalanceControl`, `PaletteDots`, all of `features/moodboard`, `/api/images/search`, empty `api/image-proxy/`, `api-key.service.ts`, `src/ai/openai.ts`, unused flows/actions (stories, presentationData, justify, generateLogo), `three-d.ts` prompt, 14 unused shadcn components (+ sheet/skeleton/use-mobile via unused sidebar), 5 unused sign-in helpers, 3 of 4 non-blocking-update helpers, `storage-utils.ts`, `placeholder-images.*`, several font/balance helpers.
49. **Unused dependencies:** next-auth, geist, date-fns, @genkit-ai/next, @genkit-ai/google-genai (unless Gemini is re-wired), patch-package, p5, react-p5, recharts, react-day-picker, openai, dotenv (only broken dev.ts), 7 Radix packages. Two motion libraries.
50. **Root clutter:** 5 ad-hoc scripts (`check-env.js` prints a FAL_KEY prefix), 4 pasted fal.ai model docs (incl. extension-less `reve-fast-remix`), obsolete auth-debug notes, Firebase Studio leftovers (`.modified`, `.idx/`), package name `nextn`, boilerplate README.
51. **Stale docs:** `claude.md` (providers, Google AI, NextAuth, env vars, test count, moodboard, Firestore structure, redirect-only sign-in, start-from-image capabilities), `docs/backend.json`, `docs/blueprint.md`, `docs/mcp-implementation-status.md`, `eng-debt.md`, `REFACTORING.md`, hardening `tasks.json` (all "pending" though most are done; Task 7 reverted, Task 8 never done).
52. **Broken dev scripts:** `genkit:dev`, `genkit:watch`. CI has no `next build` step. 44 `console.log`s, debug data (incl. user email/uid) in `sessionStorage`, PII in `FirestorePermissionError` messages sent to Sentry.
53. Marketing copy says "Unlimited logo generation attempts" while every generation costs 10 credits.

## Owner's own open items (from `todo.md`, `eng-debt.md`, `LOGO_BALANCE.md`)

- Colorize should stay close to the original logo, "like a designer may create color and B&W versions" (currently a free-form remix).
- Save the generation prompt to Firestore and stop showing it in a textbox (it *is* saved as `logo.prompt`; the textbox appears to be gone).
- R2 migration: migrate old Firebase Storage images, remove fallback paths (fallback code already removed), verify R2 public URLs.
- Logo balance: integrate auto-balance into the editor and persist it (currently only the presentation cover slide uses it).

---

## Fixed during this session (uncommitted)

| Fix | Files | Verification |
|---|---|---|
| Firebase Admin never initialized locally: the console-downloaded service-account JSON uses snake_case keys (`project_id`, `client_email`, `private_key`) but the guard checked camelCase, so init was always skipped and every server action failed with "Firebase Admin SDK not initialized". Extracted `resolveServiceAccount()` that accepts both; removed the debug logs. | [service-account.ts](../src/firebase/service-account.ts), [server.ts](../src/firebase/server.ts), [service-account.test.ts](../src/firebase/__tests__/service-account.test.ts) | 4 unit tests; after restart, server actions pass auth and reach the AI call |
| Concept auto-generation looped on failure, charging 3 credits per retry until the balance hit 0 (seen in the ledger on 2026-03-14 and 2026-10-11). Added a run-once ref guard, matching the existing logo auto-generate pattern. | [brand-detail-client.tsx](../src/app/brands/[brandId]/brand-detail-client.tsx) | Real failure (Anthropic billing) produced exactly one charge, no retries |

**Still uncommitted from before this session:** the `firestore.rules` balance-unlock and the "+10 credits" header button. These should not ship as-is (see P0-1/2).

**Environment blocker found:** the Anthropic API account behind `ANTHROPIC_API_KEY` is out of credit, so every text-AI feature currently fails.

## Open decisions for the owner

1. **Payments:** real provider (e.g. Stripe) now, or keep credits as a free/dev-only mechanism? This decides how much of P0-1/2 to build.
2. **Deploy target:** Vercel or Firebase App Hosting? (Env config and Admin SDK credential strategy differ.)
3. **Providers:** drop the fake "Gemini"/"OpenAI" options, or wire real ones?
4. **Auto-generation on brand open:** keep (with explicit cost disclosure) or make generation an explicit user action?
5. **Public sharing model:** live server-rendered views vs. snapshot copies — and what fields are public.
6. **MCP:** keep investing (fix P0-5/6, build/publish `colater-mcp`) or park it?
7. **Brand creation:** consolidate the three flows into one?
