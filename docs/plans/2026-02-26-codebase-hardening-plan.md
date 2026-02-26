# Codebase Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical security vulnerabilities, stabilize the build pipeline, and reduce architectural debt in the Colater codebase.

**Architecture:** Security fixes use Firebase Admin SDK for server-side auth verification. Build stabilization pins Node version and fixes lint. Architecture refactor enforces the existing service layer pattern and improves error handling.

**Tech Stack:** Next.js 16, Firebase Admin SDK, TypeScript, Vitest

---

### Task 1: Patch SSRF in `convertUrlToDataUri()`

**Files:**
- Modify: `src/app/actions.ts:184-205`

**Step 1: Add URL allowlist validation before the fetch call**

Replace the `convertUrlToDataUri` function with a version that validates URLs:

```typescript
const ALLOWED_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  '.r2.dev',
  '.fal.media',
  '.fal.ai',
  '.replicate.delivery',
  '.replicate.com',
];

const BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/0\./,
  /^https?:\/\/\[::1\]/,
];

function isAllowedUrl(url: string): boolean {
  if (url.startsWith('data:')) return true;
  try {
    const parsed = new URL(url);
    if (BLOCKED_PATTERNS.some(p => p.test(url))) return false;
    return ALLOWED_HOSTS.some(h =>
      h.startsWith('.') ? parsed.hostname.endsWith(h) : parsed.hostname === h
    );
  } catch {
    return false;
  }
}
```

Then at the top of `convertUrlToDataUri`:
```typescript
if (!isAllowedUrl(url)) {
  return { success: false, error: 'URL not allowed. Only images from known storage providers are accepted.' };
}
```

**Step 2: Verify the function still works with known URLs**

Test mentally: `https://pub-xxx.r2.dev/image.png` -> hostname `pub-xxx.r2.dev` -> ends with `.r2.dev` -> allowed.
`http://169.254.169.254/metadata` -> matches blocked pattern -> rejected.
`data:image/png;base64,abc` -> starts with `data:` -> allowed (legacy support).

**Step 3: Commit**

```bash
git add src/app/actions.ts
git commit -m "fix: patch SSRF vulnerability in convertUrlToDataUri

Add URL allowlist validation to prevent server-side request forgery.
Only allows fetching from known storage providers (R2, Firebase Storage,
Fal, Replicate). Blocks internal/private IP ranges.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Lock down Firestore rules — credits + public brands

**Files:**
- Modify: `firestore.rules:161-178` (credits rules)
- Modify: `firestore.rules:187-190` (public brands rules)

**Step 1: Restrict credit field modifications from client**

Change the `userProfiles/{userId}` update rule from:
```
allow update: if isOwner(userId);
```
to:
```
allow update: if isOwner(userId)
  && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['balance', 'totalPurchased', 'totalUsed']);
```

This allows clients to update profile fields (display name, preferences) but blocks direct balance manipulation. Credit mutations will only work through Firebase Admin SDK (server actions).

**Step 2: Add ownership check to public brands**

Change:
```
allow create, update: if isSignedIn();
```
to:
```
allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
```

Same for public logos:
```
allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
```

**Step 3: Deploy rules**

```bash
npx firebase deploy --only firestore:rules
```

**Step 4: Commit**

```bash
git add firestore.rules
git commit -m "fix: lock down Firestore rules for credits and public brands

Block direct client-side modification of balance/totalPurchased/totalUsed
fields in userProfiles. Add ownership checks to public brands and logos
collections to prevent cross-user data overwrites.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Auth-gate all server actions

**Files:**
- Create: `src/lib/server-auth.ts`
- Modify: `src/app/actions.ts`

**Step 1: Create server-side auth helper**

```typescript
// src/lib/server-auth.ts
import { adminAuth } from '@/firebase/server';

export async function requireServerAuth(idToken: string): Promise<{ uid: string }> {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  if (!idToken) {
    throw new Error('Authentication required');
  }
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    throw new Error('Invalid or expired authentication token');
  }
}
```

**Step 2: Add `idToken` parameter to every server action and call `requireServerAuth`**

For each of the 16 server actions, add `idToken: string` as the first parameter and add this at the top of the try block:

```typescript
await requireServerAuth(idToken);
```

Example for `getTaglineSuggestions`:
```typescript
export async function getTaglineSuggestions(
  idToken: string,  // NEW
  name: string,
  elevatorPitch: string,
  audience: string,
  desirableCues: string,
  undesirableCues: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    await requireServerAuth(idToken);  // NEW
    // ... rest unchanged
```

Apply this pattern to all 16 functions.

**Step 3: Update all client call sites to pass the ID token**

Client components that call server actions need to get the user's ID token from Firebase Auth:

```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const idToken = await auth.currentUser?.getIdToken();
if (!idToken) throw new Error('Not authenticated');

// Then pass it as first argument:
const result = await getTaglineSuggestions(idToken, name, pitch, audience, cues, uncues);
```

Key call sites to update:
- `src/app/brands/[brandId]/brand-detail-client.tsx` — logo generation, colorization, critique, vectorization, concept
- `src/features/brands/components/taglines-list.tsx` — tagline generation
- `src/app/brands/[brandId]/presentation/presentation-client.tsx` — presentation data/narrative
- `src/app/brands/new/new-brand-client.tsx` — brand suggestions
- `src/app/taglines/taglines-client.tsx` — tagline generation

**Step 4: Run typecheck to verify no call sites missed**

```bash
npm run typecheck
```

Expected: All calls pass the new `idToken` parameter. Any missed call sites will show TypeScript errors.

**Step 5: Commit**

```bash
git add src/lib/server-auth.ts src/app/actions.ts
git add -u  # staged modified client files
git commit -m "fix: auth-gate all server actions with Firebase ID token verification

Add requireServerAuth() helper using Firebase Admin SDK. Every server
action now requires a valid Firebase ID token as the first parameter.
Prevents unauthenticated users from consuming AI API credits.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Fix broken linting

**Files:**
- Modify: `package.json` (lint script)
- Possibly modify: eslint config

**Step 1: Diagnose the lint failure**

```bash
npm run lint 2>&1
```

The error `Invalid project directory provided, no such directory: .../lint` suggests Next.js 16 CLI is misinterpreting the `next lint` command. Try:

```bash
npx next lint --dir src 2>&1
```

If that works, update `package.json`:
```json
"lint": "next lint --dir src"
```

If that also fails, check if there's an eslint flat config issue and fall back to direct eslint:
```json
"lint": "eslint src --ext .ts,.tsx"
```

**Step 2: Fix any lint errors that surface**

Run the fixed lint command and fix errors.

**Step 3: Verify CI would catch failures**

The CI workflow at `.github/workflows/ci.yml` already runs `npm run lint`. Once the script works locally, CI will work too.

**Step 4: Commit**

```bash
git add package.json
git commit -m "fix: repair broken lint command

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Pin Node version and clean up repo

**Files:**
- Create: `.nvmrc`
- Modify: `package.json` (add engines)
- Modify: `.github/workflows/ci.yml` (pin to 22)
- Modify: `.gitignore`
- Delete: 32+ temp files from root, `src/lib/image-utils.ts.backup`

**Step 1: Create `.nvmrc`**

```
22
```

**Step 2: Add engines to `package.json`**

```json
"engines": {
  "node": ">=20 <23"
}
```

**Step 3: Update CI to Node 22**

In `.github/workflows/ci.yml`, change:
```yaml
node-version: 20
```
to:
```yaml
node-version: 22
```

**Step 4: Delete temp files**

```bash
rm -f generate-iconic-logos.js generate-logos-v2.js generate-techflow-logos.js test-fal-simple.js test-logo-generation.js
rm -f iconic-*.svg iconic-logos.html
rm -f techflow-*.html techflow-*.png
rm -f src/lib/image-utils.ts.backup
```

**Step 5: Add gitignore patterns**

Append to `.gitignore`:
```
# Temp/generated files
*.backup
```

**Step 6: Commit**

```bash
git add .nvmrc .gitignore .github/workflows/ci.yml package.json
git commit -m "chore: pin Node 22, clean up temp files, update CI

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Remove hardcoded Firebase config fallbacks

**Files:**
- Modify: `src/firebase/config.ts`

**Step 1: Replace fallback values with required env vars**

```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const baseConfig = {
  projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  measurementId: '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
};
```

Only `projectId`, `appId`, and `apiKey` are truly required. `storageBucket` and `messagingSenderId` can default to empty since the app can partially function without them.

**Step 2: Verify dev server still starts**

```bash
npm run dev
```

Expected: Works because `.env` has all the required variables.

**Step 3: Commit**

```bash
git add src/firebase/config.ts
git commit -m "fix: remove hardcoded Firebase config fallbacks

Fail loudly with clear error message when required env vars are missing
instead of silently connecting to production credentials.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Clean up debug logging in AI flows

**Files:**
- Modify: `src/ai/flows/generate-logo-fal.ts` (remove 16 console.log)
- Modify: `src/ai/flows/generate-logo-openai.ts` (remove 17 console.log)
- Modify: `src/app/actions.ts` (remove debug console.log, keep console.error for now)

**Step 1: Remove all `console.log` from the AI flow files**

In `generate-logo-fal.ts` and `generate-logo-openai.ts`, delete every line that is purely a `console.log(...)` call. Keep `console.error` for actual error conditions.

**Step 2: Remove debug `console.log` from `actions.ts`**

Remove lines like:
```typescript
console.log("getLogoSuggestion: Starting...");
console.log("getLogoSuggestion: Brand details are present.");
console.log("getLogoSuggestion: AI generation complete.");
console.log("getLogoSuggestion: Received data URI from AI:", ...);
```

Keep `console.error` in catch blocks for now (will be replaced by error handler in a future task).

**Step 3: Run typecheck**

```bash
npm run typecheck
```

**Step 4: Commit**

```bash
git add src/ai/flows/generate-logo-fal.ts src/ai/flows/generate-logo-openai.ts src/app/actions.ts
git commit -m "chore: remove debug console.log from AI flows and server actions

Remove 33+ debug logging statements from logo generation flows and
server actions. Keep console.error for actual error conditions.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Deploy Firestore rules

**Step 1: Deploy the updated rules**

```bash
npx firebase deploy --only firestore:rules
```

Expected: `released rules firestore.rules to cloud.firestore`

**Step 2: Verify the app still works**

Navigate to http://localhost:3000, sign in, verify brands load and credits display correctly.

---

## Tasks Not In This Plan (Future Work)

The following items from the design doc are deferred to separate plans due to their scope:

- **3a. Enforce service layer** — 28 Firestore mutations to migrate across 4 files
- **3b. Break up mega-components** — requires careful refactoring of 3 files totaling 2,379 lines
- **3c. Fix error handling** — create `useErrorHandler` hook, update ~90 catch blocks
- **3d. Type presentation slides** — create discriminated union, update 2 files
- **3e. Clean up remaining debug logging** — client-side `console.error` replacement (depends on 3c)

These are all independent and each should be its own implementation plan.
