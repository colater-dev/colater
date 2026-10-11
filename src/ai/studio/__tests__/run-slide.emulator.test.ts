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
      generateConcept: async () => ({ idea: 'Simpler idea', rationale: 'r', markPrompt: 'p2', captions: { mark: 'm2', lockup: 'l2', inUse: 'u2' }, typeSample: { headline: 'h', body: 'b' } }),
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

  it('a failed mark redo keeps the old mark visible and refunds', async () => {
    const { uid, credits, ref, deps, base } = await setup({ generateConcept: async () => { throw new Error('Concept generation timed out'); } });
    await credits.charge({ uid, amount: 5, action: 'studioMarkRedo', key: 'k4' });
    await runSlide(deps, { uid, brandId: 'b', directionId: 'd', kind: 'mark', chargeKey: 'k4', cost: 5, brief: base, feedback: { chips: ['simpler'] } });
    const d = (await ref.get()).data()!;
    expect(d.status).toBe('ready');
    expect(d.markUrl).toBe('https://r2.example/old.png');
    expect(d.redoError).toContain('timed out');
    expect(d.slides.vector.status).toBe('ready');
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS);
  });

  it('a redo that fails at rendering keeps the old concept with the old mark', async () => {
    const { uid, credits, ref, deps, base } = await setup({ renderMark: async () => { throw new Error('render timed out'); } });
    await credits.charge({ uid, amount: 5, action: 'studioMarkRedo', key: 'k5' });
    await runSlide(deps, { uid, brandId: 'b', directionId: 'd', kind: 'mark', chargeKey: 'k5', cost: 5, brief: base });
    const d = (await ref.get()).data()!;
    expect(d.markUrl).toBe('https://r2.example/old.png');
    expect(d.concept.idea).toBe('An idea');
  });

  it('a vector that finishes after the mark changed is discarded and refunded', async () => {
    const { uid, credits, ref, deps, base } = await setup({
      vectorizeMark: async () => {
        await ref.update({ markUrl: 'https://r2.example/redone.png' }); // a redo finished meanwhile
        return { buffer: Buffer.from('<svg/>'), contentType: 'image/svg+xml' };
      },
    });
    await credits.charge({ uid, amount: 5, action: 'studioVector', key: 'k6' });
    await runSlide(deps, { uid, brandId: 'b', directionId: 'd', kind: 'vector', chargeKey: 'k6', cost: 5, brief: base });
    const d = (await ref.get()).data()!;
    expect(d.slides.vector.status).toBe('failed');
    expect(d.slides.vector.error).toContain('mark changed');
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS);
  });
});
