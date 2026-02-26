# Codebase Hardening Design

**Date:** 2026-02-26
**Status:** Approved
**Context:** The codebase has accumulated security vulnerabilities, build issues, and architectural debt. The app is deployed with a few users. This design covers a comprehensive cleanup in three phases.

---

## Audit Findings Summary

| Category | Finding | Severity |
|----------|---------|----------|
| Server actions (16 functions) have zero auth checks | Anyone can burn API credits | Critical |
| Credits system is entirely client-side | Users can give themselves unlimited credits | Critical |
| `convertUrlToDataUri()` fetches any URL | SSRF vulnerability | High |
| `userProfiles` Firestore rules have no field validation | Direct balance manipulation | Critical |
| Public `/brands` collection allows any user to write any brand | Data overwrite | Medium |
| `npm run lint` is broken | CI lint step ineffective | Medium |
| No `.nvmrc` or `engines` field | Node version mismatch issues | Medium |
| `next-auth` is beta (`5.0.0-beta.25`) | Potential instability | Medium |
| 28 direct Firestore mutations bypass service layer | Architecture violation | Medium |
| 3 components over 660 lines each | Maintainability | Medium |
| ~90 catch blocks only log to console | Users see no error feedback | Medium |
| 88 uses of `any` types | Type safety gaps | Low |
| 181 `console.log`/`console.error` calls | Debug noise | Low |
| 32 temp files in repo root | Clutter | Low |

---

## Phase 1: Security Hotfixes (Immediate)

### 1a. Auth-gate all server actions

**Problem:** All 16 server actions in `src/app/actions.ts` accept calls from anyone. Unauthenticated users can consume OpenAI/Anthropic/Fal API credits without limit.

**Solution:**
- Create `requireServerAuth()` helper using Firebase Admin SDK (`src/firebase/server.ts` already has admin initialized)
- The helper verifies a Firebase ID token passed from the client
- Add it to the top of every server action — reject with an error if auth fails
- Client components pass the user's ID token when calling server actions

**Files changed:**
- `src/app/actions.ts` — add auth check to all 16 functions
- `src/lib/server-auth.ts` — new helper (small, ~20 lines)
- Client components that call actions — pass ID token

### 1b. Lock down credits in Firestore rules

**Problem:** `userProfiles/{userId}` update rule (`allow update: if isOwner(userId)`) has no field validation. A user can set `balance: 999999` from the browser console.

**Solution:**
- Restrict the update rule to prevent direct modification of `balance`, `totalPurchased`, and `totalUsed`
- Only allow these fields to change via server-side operations (server actions that verify the transaction)
- The credits deduction flow should work through a server action that validates the operation before updating Firestore via Admin SDK

**Files changed:**
- `firestore.rules` — add field-level validation to `userProfiles/{userId}` update rule
- `src/services/credits.service.ts` — move `addCredits` and `deductCredits` to server actions
- `src/app/actions.ts` — add credit mutation server actions

### 1c. Patch SSRF in `convertUrlToDataUri()`

**Problem:** The function fetches any URL from the server, allowing access to internal network resources.

**Solution:**
- Add URL allowlist: R2 bucket (`r2.dev`), Firebase Storage (`firebasestorage.googleapis.com`, `storage.googleapis.com`), Fal (`fal.media`, `fal.ai`), Replicate (`replicate.delivery`, `replicate.com`)
- Reject URLs containing `localhost`, `127.0.0.1`, `169.254.x.x`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- Also accept `data:` URIs (pass through, legacy base64 support)

**Files changed:**
- `src/app/actions.ts` — add allowlist validation to `convertUrlToDataUri()`

### 1d. Fix public brands ownership

**Problem:** `/brands/{brandId}` allows `create, update: if isSignedIn()` — any authenticated user can overwrite any public brand.

**Solution:**
- Add `request.resource.data.userId == request.auth.uid` to create and update rules

**Files changed:**
- `firestore.rules`

---

## Phase 2: Build Stabilization

### 2a. Fix broken linting

**Problem:** `npm run lint` errors with `Invalid project directory provided`.

**Solution:**
- Diagnose the Next.js 16.x lint CLI issue (likely needs explicit `--dir src` or eslint config)
- Fix the lint command in `package.json`
- Verify CI workflow fails when lint fails
- Fix any lint errors that surface

**Files changed:**
- `package.json` — fix lint script
- `.eslintrc*` or `eslint.config.*` — fix config if needed
- Various source files — fix lint errors

### 2b. Pin Node version

**Problem:** No `.nvmrc`, no `engines` field. Node 23 in use but Vitest requires 20 or 22.

**Solution:**
- Add `.nvmrc` with `22` (current LTS)
- Add `"engines": { "node": ">=20 <23" }` to `package.json`
- Update CI to use Node 22

**Files changed:**
- `.nvmrc` — new file
- `package.json` — add engines
- `.github/workflows/ci.yml` — pin node version

### 2c. Clean up repo root

**Problem:** 32 untracked temp files (HTML demos, generated PNGs/SVGs, test scripts) and 1 backup file in `src/`.

**Solution:**
- Delete all temp/test files from repo root
- Delete `src/lib/image-utils.ts.backup`
- Add `.gitignore` entries for common throwaway patterns

**Files changed:**
- Delete 32 files from root + 1 backup in `src/`
- `.gitignore` — add patterns

### 2d. Remove hardcoded Firebase config fallbacks

**Problem:** `src/firebase/config.ts` has hardcoded API keys as fallback values, silently connecting to production when env vars are missing.

**Solution:**
- Remove `|| "hardcoded-value"` fallbacks
- Fail loudly with a clear error if env vars are missing

**Files changed:**
- `src/firebase/config.ts`

---

## Phase 3: Architecture Refactor

### 3a. Enforce the service layer

**Problem:** 28 direct Firestore mutations in UI components bypass the service layer.

**Solution:**
- Add missing methods to `BrandService`, `LogoService`, `TaglineService` for operations not yet covered (update logo font, publish to public collection, add color versions, update critique, update vector URL, etc.)
- Replace all 28 direct `updateDoc`/`addDoc`/`setDoc` calls with service method calls
- Primary target: `brand-detail-client.tsx` (22 calls), `taglines-client.tsx` (4), `brand-header.tsx` (1), `logo-detail-client.tsx` (1)

**Files changed:**
- `src/services/brand.service.ts` — add missing methods
- `src/services/logo.service.ts` — add missing methods
- `src/app/brands/[brandId]/brand-detail-client.tsx` — replace 22 direct calls
- `src/app/taglines/taglines-client.tsx` — replace 4 direct calls
- `src/features/brands/components/brand-header.tsx` — replace 1 direct call
- `src/app/brands/[brandId]/logos/[logoId]/logo-detail-client.tsx` — replace 1 direct call

### 3b. Break up mega-components

**Problem:** Three components over 660 lines each, mixing multiple concerns.

**Solution:**

`logo-showcase.tsx` (995 lines) split into:
- `LogoCanvas` — SVG rendering and layout
- `LogoCropTool` — cropping interface
- `LogoExport` — export to formats
- `LogoFontPicker` — font selection

`brand-detail-client.tsx` (718 lines) — after 3a removes Firestore calls, extract:
- `useBrandActions` hook — brand mutation logic
- `useLogoActions` hook — logo mutation logic
- `useColorization` hook — colorization flow

`brand-identity-card.tsx` (666 lines) split into:
- Generation logic separated from display logic
- Logo display settings extracted to own component

### 3c. Fix error handling

**Problem:** ~90 catch blocks that only `console.error`, leaving users with frozen spinners. 5 completely silent `.catch(() => {})` blocks.

**Solution:**
- Create `useErrorHandler` hook: shows toast notification on error, optionally reports to Sentry
- Replace `catch (error) { console.error(...) }` with `catch (error) { handleError(error, 'user-facing message') }`
- Replace 5 silent catches with fallback image states

**Files changed:**
- `src/hooks/use-error-handler.ts` — new hook (~30 lines)
- All files with catch blocks — one-line change per site

### 3d. Type the presentation slides

**Problem:** 20 `as any` casts across presentation files because slide content has no proper types.

**Solution:**
- Create discriminated union type for slide content: `CoverSlide | MissionSlide | PaletteSlide | ...`
- Replace all `content as any` with typed access
- Type `onUpdate` callbacks properly

**Files changed:**
- `src/lib/types.ts` — add slide content types
- `src/app/brands/[brandId]/presentation/presentation-client.tsx` — remove 10 `as any`
- `src/app/p/[shareToken]/public-presentation-client.tsx` — remove 10 `as any`

### 3e. Clean up debug logging

**Problem:** 79 `console.log` calls (mostly AI flows) and 102 `console.error` calls.

**Solution:**
- Remove all debug `console.log` from AI flows (33 across fal + openai flows)
- Remove debug logging from `non-blocking-login.tsx` (9 calls)
- Replace client-side `console.error` with `useErrorHandler` from 3c

**Files changed:**
- `src/ai/flows/generate-logo-fal.ts` — remove 16 `console.log`
- `src/ai/flows/generate-logo-openai.ts` — remove 17 `console.log`
- `src/firebase/non-blocking-login.tsx` — remove 9 `console.log`
- Various client components

### 3f. Fix public brands ownership (covered in 1d)

Already handled in Phase 1.

---

## Execution Order

```
Phase 1 (security, do first)
  1a. Auth-gate server actions
  1b. Lock down credits rules
  1c. Patch SSRF
  1d. Fix public brands ownership
  ↓
Phase 2 (stability)
  2a. Fix linting
  2b. Pin Node version
  2c. Clean up repo root
  2d. Remove config fallbacks
  ↓
Phase 3 (architecture, can be done incrementally)
  3a. Enforce service layer
  3b. Break up mega-components
  3c. Fix error handling
  3d. Type presentation slides
  3e. Clean up debug logging
```

Phase 3 items are independent — they can be done in any order and each one delivers standalone value.
