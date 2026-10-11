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
      expect(d.stage).toBe('mark');
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
