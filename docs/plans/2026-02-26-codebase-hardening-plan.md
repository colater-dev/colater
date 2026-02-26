# Codebase Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical security vulnerabilities, stabilize the build pipeline, and clean up architectural debt in the Colater codebase.

**Architecture:** Three-phase approach — security hotfixes first (deployed app is exploitable), then build stabilization (CI is partially broken), then incremental architecture refactoring (service layer enforcement, error handling, debug logging).

**Tech Stack:** Next.js 16, Firebase (client + Admin SDK), TypeScript, Firestore Security Rules, Vitest

**Design doc:** `docs/plans/2026-02-26-codebase-hardening-design.md`

---

## Phase 1: Security Hotfixes

### Task 1: Patch SSRF in `convertUrlToDataUri()`

**Files:**
- Modify: `src/app/actions.ts:184-205`
- Create: `src/lib/__tests__/url-allowlist.test.ts`

**Step 1: Write URL allowlist tests**

```typescript
// src/lib/__tests__/url-allowlist.test.ts
import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '@/lib/server-auth';

describe('isAllowedUrl', () => {
  it('allows R2 bucket URLs', () => {
    expect(isAllowedUrl('https://pub-3cb2c9b025f644669c496b633a36faba.r2.dev/image.png')).toBe(true);
  });
  it('allows Firebase Storage URLs', () => {
    expect(isAllowedUrl('https://firebasestorage.googleapis.com/v0/b/test/o/img.png')).toBe(true);
    expect(isAllowedUrl('https://storage.googleapis.com/test/img.png')).toBe(true);
  });
  it('allows Fal media URLs', () => {
    expect(isAllowedUrl('https://v3.fal.media/files/test/image.png')).toBe(true);
  });
  it('allows data URIs (legacy base64 support)', () => {
    expect(isAllowedUrl('data:image/png;base64,iVBOR...')).toBe(true);
  });
  it('rejects localhost', () => {
    expect(isAllowedUrl('http://localhost:8080/secret')).toBe(false);
  });
  it('rejects cloud metadata endpoint', () => {
    expect(isAllowedUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
  });
  it('rejects private network IPs', () => {
    expect(isAllowedUrl('http://10.0.0.1/internal')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1/admin')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1/private')).toBe(false);
  });
  it('rejects arbitrary external URLs', () => {
    expect(isAllowedUrl('https://evil.com/steal-data')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/url-allowlist.test.ts`
Expected: FAIL — `isAllowedUrl` not found

**Step 3: Create the server-auth module with URL allowlist**

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
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[::1\]/,
];

export function isAllowedUrl(url: string): boolean {
  if (url.startsWith('data:')) return true;
  try {
    const parsed = new URL(url);
    if (BLOCKED_PATTERNS.some(p => p.test(parsed.hostname))) return false;
    return ALLOWED_HOSTS.some(h =>
      h.startsWith('.') ? parsed.hostname.endsWith(h) : parsed.hostname === h
    );
  } catch {
    return false;
  }
}
```

**Step 4: Add URL validation to `convertUrlToDataUri` in actions.ts**

At the top of the function, after the existing try/catch open:
```typescript
import { isAllowedUrl } from '@/lib/server-auth';

// Inside convertUrlToDataUri:
if (!isAllowedUrl(url)) {
  return { success: false, error: 'URL not allowed. Only images from known storage providers are accepted.' };
}
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/__tests__/url-allowlist.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/server-auth.ts src/lib/__tests__/url-allowlist.test.ts src/app/actions.ts
git commit -m "security: patch SSRF in convertUrlToDataUri with URL allowlist"
```

---

### Task 2: Lock down Firestore rules — credits + public brands

**Files:**
- Modify: `firestore.rules:161-178` (credits rules)
- Modify: `firestore.rules:187-202` (public brands/logos rules)

**Step 1: Block direct credit field modification from clients**

In `firestore.rules`, change the `userProfiles/{userId}` update rule (line 165) from:
```
allow update: if isOwner(userId);
```
to:
```
allow update: if isOwner(userId)
        && !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['balance', 'totalPurchased', 'totalUsed']);
```

This allows profile updates but blocks direct balance manipulation. Credit changes will go through the Admin SDK via server actions.

**Step 2: Add ownership check to public brands**

Change line 190 from:
```
allow create, update: if isSignedIn();
```
to:
```
allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
```

Also change the public logos rule (line 202) from:
```
allow create, update: if isSignedIn();
```
to:
```
allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
```

**Step 3: Deploy rules**

Run: `npx firebase deploy --only firestore:rules`
Expected: `released rules firestore.rules to cloud.firestore`

**Step 4: Commit**

```bash
git add firestore.rules
git commit -m "security: lock down credits rules and public brands ownership"
```

---

### Task 3: Move credit purchases to server action

**Files:**
- Modify: `src/app/actions.ts` — add `purchaseCredits` server action
- Modify: `src/app/credits/credits-client.tsx` — call server action instead of client-side `addCredits`

**Step 1: Read the credits client to understand current flow**

Read: `src/app/credits/credits-client.tsx`

**Step 2: Add server-side `purchaseCredits` action**

In `src/app/actions.ts`, add:
```typescript
import { adminDb } from '@/firebase/server';
import * as admin from 'firebase-admin';

export async function purchaseCredits(
  idToken: string,
  amount: number,
  packageLabel: string
): Promise<{ success: boolean; data?: number; error?: string }> {
  const { uid } = await requireServerAuth(idToken);

  if (amount <= 0 || amount > 200) {
    return { success: false, error: 'Invalid credit amount' };
  }

  try {
    const profileRef = adminDb.collection('userProfiles').doc(uid);
    const newBalance = await adminDb.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
      const snap = await transaction.get(profileRef);
      const current = snap.exists ? snap.data()?.balance ?? 0 : 0;
      const balance = current + amount;
      if (snap.exists) {
        transaction.update(profileRef, {
          balance,
          totalPurchased: admin.firestore.FieldValue.increment(amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        transaction.set(profileRef, {
          balance,
          totalPurchased: amount,
          totalUsed: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      return balance;
    });

    // Record transaction
    await adminDb.collection(`userProfiles/${uid}/transactions`).add({
      userId: uid,
      amount,
      balance: newBalance,
      action: 'purchase',
      description: `Purchased ${packageLabel} pack (${amount} credits)`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, data: newBalance };
  } catch (error) {
    console.error('Error purchasing credits:', error);
    return { success: false, error: 'Failed to purchase credits' };
  }
}
```

**Step 3: Update credits client to use server action**

Replace the direct `creditsService.addCredits()` call with `purchaseCredits(idToken, amount, label)`.

**Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/actions.ts src/app/credits/credits-client.tsx
git commit -m "security: move credit purchases to server-side action"
```

---

### Task 4: Auth-gate all server actions

**Files:**
- Modify: `src/app/actions.ts` — add `idToken` param + `requireServerAuth` to all 16 functions
- Modify: all client call sites

**Step 1: Add `idToken` parameter and auth check to every server action**

For each of the 16 existing functions in `actions.ts`, add `idToken: string` as the first parameter, and add `await requireServerAuth(idToken);` as the first line in the try block.

Pattern:
```typescript
// Before:
export async function getTaglineSuggestions(
  name: string, ...
) {
  try {

// After:
export async function getTaglineSuggestions(
  idToken: string,
  name: string, ...
) {
  try {
    await requireServerAuth(idToken);
```

Also remove the 5 debug `console.log` calls from `getLogoSuggestion` (lines 51, 54, 57, 60, 67).

**Step 2: Update all client call sites**

Every place that calls a server action needs to pass the ID token. Add a helper or use inline:

```typescript
const idToken = await user.getIdToken();
const result = await getTaglineSuggestions(idToken, name, pitch, audience, cues, uncues);
```

Key files to update (search for imports from `@/app/actions`):
- `src/app/brands/[brandId]/brand-detail-client.tsx`
- `src/features/brands/components/taglines-list.tsx`
- `src/features/brands/components/brand-identity-card.tsx`
- `src/app/brands/[brandId]/presentation/presentation-client.tsx`
- `src/app/brands/new/new-brand-client.tsx`
- `src/app/taglines/taglines-client.tsx`
- `src/app/onboarding/steps/audience/audience-step-client.tsx`

**Step 3: Run typecheck to verify no missed call sites**

Run: `npm run typecheck`
Expected: PASS — TypeScript will error on any call site that's missing the new `idToken` parameter

**Step 4: Run tests**

Run: `npm test`
Expected: PASS (117 tests)

**Step 5: Commit**

```bash
git add src/app/actions.ts
git add -u
git commit -m "security: auth-gate all 16 server actions with Firebase ID token verification"
```

---

## Phase 2: Build Stabilization

### Task 5: Fix broken linting

**Files:**
- Modify: `package.json` (lint script)

**Step 1: Diagnose the issue**

Run: `npx next lint --dir src 2>&1`

If that works, update `package.json`:
```json
"lint": "next lint --dir src"
```

If that also fails, try direct eslint:
```json
"lint": "eslint src --ext .ts,.tsx"
```

**Step 2: Run lint and fix any errors**

Run: `npm run lint`
Fix reported errors.

**Step 3: Verify the full CI suite passes locally**

Run: `npm run typecheck && npm run lint && npm test`
Expected: All three pass

**Step 4: Commit**

```bash
git add package.json
git add -u
git commit -m "fix: repair broken lint command"
```

---

### Task 6: Pin Node version and clean up repo

**Files:**
- Create: `.nvmrc`
- Modify: `package.json` (add engines)
- Modify: `.github/workflows/ci.yml` (Node 22)
- Modify: `.gitignore`
- Delete: ~30 temp files from root + `src/lib/image-utils.ts.backup`

**Step 1: Create `.nvmrc`**

Content: `22`

**Step 2: Add engines to `package.json`**

After `"private": true,`:
```json
"engines": {
  "node": ">=20 <23"
},
```

**Step 3: Update CI to Node 22**

In `.github/workflows/ci.yml` line 14, change `node-version: 20` to `node-version: 22`.

**Step 4: Delete temp files**

```bash
rm -f generate-iconic-logos.js generate-logos-v2.js generate-techflow-logos.js
rm -f test-fal-simple.js test-logo-generation.js test-fal-logic.js test-fal.js test-ideogram.js
rm -f check-env.js check-fal.js
rm -f iconic-*.svg iconic-logos.html
rm -f techflow-*.html techflow-*.png
rm -f CLAUDE-MIGRATION-GUIDE.md GOOGLE-GENAI-USAGE-AUDIT.md LOADING-STATES-FIX.md
rm -f MIGRATION-COMPLETE.md PRESENTATION-FIX.md WHY-V2-IS-BETTER.md
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
git commit -m "chore: pin Node 22, clean up temp files, update CI"
```

---

### Task 7: Remove hardcoded Firebase config fallbacks

**Files:**
- Modify: `src/firebase/config.ts:6-13`

**Step 1: Replace fallbacks with non-null assertions**

Change the `baseConfig` object to:
```typescript
const baseConfig = {
  "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  "storageBucket": process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  "measurementId": "",
  "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""
};
```

Only the first three are critical. `storageBucket` and `messagingSenderId` can safely default to empty.

**Step 2: Verify dev server starts**

Run: `npm run dev` (briefly)
Expected: Starts normally — `.env` has all required vars

**Step 3: Commit**

```bash
git add src/firebase/config.ts
git commit -m "chore: remove hardcoded Firebase config fallbacks"
```

---

## Phase 3: Architecture Cleanup

### Task 8: Create useErrorHandler hook

**Files:**
- Create: `src/hooks/use-error-handler.ts`

**Step 1: Write the hook**

```typescript
// src/hooks/use-error-handler.ts
'use client';

import { useToast } from '@/hooks/use-toast';
import * as Sentry from '@sentry/nextjs';

export function useErrorHandler() {
  const { toast } = useToast();

  return function handleError(error: unknown, userMessage: string) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    if (typeof Sentry?.captureException === 'function') {
      Sentry.captureException(errorObj);
    }

    toast({
      title: 'Something went wrong',
      description: userMessage,
      variant: 'destructive',
    });

    console.error(`${userMessage}:`, errorObj);
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-error-handler.ts
git commit -m "feat: add useErrorHandler hook for user-facing error feedback"
```

---

### Task 9: Clean up debug logging from AI flows

**Files:**
- Modify: `src/ai/flows/generate-logo-fal.ts` — remove 16 `console.log`
- Modify: `src/ai/flows/generate-logo-openai.ts` — remove 17 `console.log`
- Modify: `src/firebase/non-blocking-login.tsx` — remove 9 `console.log`

**Step 1: Remove all `console.log` lines from each file**

Delete every `console.log(...)` line. Keep `console.error` for actual errors.

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/ai/flows/generate-logo-fal.ts src/ai/flows/generate-logo-openai.ts src/firebase/non-blocking-login.tsx
git commit -m "chore: remove 42 debug console.log calls from AI flows and auth"
```

---

### Task 10: Final verification

**Step 1: Run full check suite**

```bash
npm run typecheck && npm run lint && npm test
```
Expected: All pass

**Step 2: Start dev server and smoke test**

Run: `npm run dev`

Verify:
1. Sign in with Google works
2. Dashboard loads brands
3. Credit balance displays
4. Opening a brand page works

**Step 3: Deploy Firestore rules if not done in Task 2**

Run: `npx firebase deploy --only firestore:rules`

---

## Summary

| Task | Phase | Description | Severity |
|------|-------|-------------|----------|
| 1 | Security | Patch SSRF with URL allowlist | High |
| 2 | Security | Lock down credits + public brands in Firestore rules | Critical |
| 3 | Security | Move credit purchases to server action | Critical |
| 4 | Security | Auth-gate all 16 server actions | Critical |
| 5 | Stability | Fix broken lint command | Medium |
| 6 | Stability | Pin Node 22, clean up 30+ temp files | Medium |
| 7 | Stability | Remove hardcoded Firebase config fallbacks | Low |
| 8 | Architecture | Create useErrorHandler hook | Medium |
| 9 | Architecture | Remove 42 debug console.log calls | Low |
| 10 | Verification | Full end-to-end verification | Required |

## Future Work (separate plans)

- **Service layer enforcement** — migrate 28 direct Firestore calls to services
- **Component decomposition** — break up logo-showcase.tsx (995 lines), brand-detail-client.tsx (718 lines), brand-identity-card.tsx (666 lines)
- **Error handling rollout** — replace ~90 console.error-only catch blocks with useErrorHandler
- **Presentation slide types** — create discriminated union, remove 20 `as any` casts
