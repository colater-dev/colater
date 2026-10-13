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

  let usedSeen: string[][] = [];
  let surfacesSeen: string[] = [];
  async function setup(failModel?: string, existingPalette?: string, sticker: 'ok' | 'throws' = 'ok') {
    surfacesSeen = [];
    usedSeen = [];
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const credits = createServerCredits(db);
    await credits.charge({ uid, amount: 15, action: 'studioRound', key: 'round_x' });
    const base = `users/${uid}/brands/b/directions`;
    await db.doc(`users/${uid}/brands/b`).set({ source: 'studio', latestName: 'N' });
    const directions = recipes.map((recipe, i) => ({ id: `d${i}`, recipe }));
    for (const d of directions) await db.doc(`${base}/${d.id}`).set({ roundId: 'r', recipe: d.recipe, status: 'pending' });
    if (existingPalette) await db.doc(`${base}/older`).set({ roundId: 'r0', status: 'ready', paletteName: existingPalette });
    const deps: RoundDeps = {
      db, credits,
      generateConcept: async b => ({ idea: `idea ${b.recipe.model}`, rationale: 'r', markPrompt: 'p', captions: { mark: 'm', lockup: 'l', inUse: 'u' }, stickerSurface: 'concrete wall', typeSample: { headline: 'h', body: 'b' } }),
      renderMark: async p => { if (p === failModel) throw new Error('Application not found'); return { buffer: Buffer.from('x'), contentType: 'image/png', qa: { score: 7, hasWords: false, hasTextureOrShading: false, tooDetailed: false, tooThin: false, mergesSeveralIdeas: false, resemblesHateSymbol: false, fix: '' } }; },
      uploadMark: async () => 'https://r2.example/mark.png',
      pickFont: async () => 'Caprasimo',
      stickerBackground: async surface => {
        surfacesSeen.push(surface);
        if (sticker === 'throws') throw new Error('Openverse 429');
        return { url: 'https://r2.example/bg.jpg', title: 'Wall', creator: 'Jane', license: 'cc0', sourceUrl: 'https://flickr.com/a' };
      },
      choosePalette: async ({ used }) => { usedSeen.push([...used]); return { name: used.includes('Misty Morning') ? 'Vinyl Groove' : 'Misty Morning', colors: [{ role: 'primary', hex: '#4A90A4', name: 'Primary' }] as never }; },
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

  it('gives every direction a palette, passing names already used on the page', async () => {
    const { base } = await setup(undefined, 'Harbor Fog');
    for (const i of [0, 1, 2]) {
      const d = (await db.doc(`${base}/d${i}`).get()).data()!;
      expect(d.slides.color.status).toBe('ready');
      expect(d.slides.color.palette[0].hex).toBe('#4A90A4');
      expect(['Misty Morning', 'Vinyl Groove']).toContain(d.paletteName);
    }
    expect(usedSeen[0]).toEqual(['Harbor Fog']);
    expect(usedSeen[1]).toEqual(['Harbor Fog', 'Misty Morning']);
    expect(usedSeen[2]).toEqual(['Harbor Fog', 'Misty Morning', 'Vinyl Groove']);
  });

  it('saves a royalty-free sticker background found from the concept surface', async () => {
    const { base } = await setup();
    expect(surfacesSeen).toEqual(['concrete wall', 'concrete wall', 'concrete wall']);
    const d = (await db.doc(`${base}/d0`).get()).data()!;
    expect(d.stickerBg).toEqual({ url: 'https://r2.example/bg.jpg', title: 'Wall', creator: 'Jane', license: 'cc0', sourceUrl: 'https://flickr.com/a' });
  });

  it('a failed photo search never fails the direction', async () => {
    const { base } = await setup(undefined, undefined, 'throws');
    const d = (await db.doc(`${base}/d0`).get()).data()!;
    expect(d.status).toBe('ready');
    expect(d.stickerBg).toBeUndefined();
  });

  it('keeps the quality check verdict on the direction for later analysis', async () => {
    const { base } = await setup();
    const d = (await db.doc(`${base}/d0`).get()).data()!;
    expect(d.markQa.score).toBe(7);
  });

  it('gives the brand a dashboard logo once its directions are ready', async () => {
    const { uid } = await setup();
    const brand = (await db.doc(`users/${uid}/brands/b`).get()).data()!;
    expect(brand.logoUrl).toBe('https://r2.example/mark.png');
    expect(brand.font).toBe('Caprasimo');
  });
});
