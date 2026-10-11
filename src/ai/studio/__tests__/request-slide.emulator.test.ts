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
    const a = { uid, brandId: 'b', directionId: 'd', kind: 'vector' as const, clientRequestId: 'req12345' };
    const [r1, r2] = await Promise.all([requestSlide(db, credits, a), requestSlide(db, credits, a)]);
    expect([r1.status, r2.status].sort()).toEqual(['duplicate', 'scheduled']);
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS - 5);
    const slide = (await db.doc(`users/${uid}/brands/b/directions/d`).get()).data()!.slides.vector;
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

  it('refuses a second paid request while the same slide is pending (no extra charge)', async () => {
    const { uid, credits } = await setup();
    await requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'voice', clientRequestId: 'reqAAAAAA' });
    await expect(requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'voice', clientRequestId: 'reqBBBBBB' })).rejects.toThrow('Already generating');
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS - 2);
  });

  it('refuses a mark redo while any slide is pending, and paid slides while the mark is regenerating', async () => {
    const { uid, credits } = await setup();
    await requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'vector', clientRequestId: 'reqCCCCCC' });
    await expect(requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'mark', clientRequestId: 'reqDDDDDD' })).rejects.toThrow('Already generating');
    const other = await setup({ status: 'generating', markUrl: 'https://x/m.png' });
    await expect(requestSlide(db, other.credits, { uid: other.uid, brandId: 'b', directionId: 'd', kind: 'color', clientRequestId: 'reqEEEEEE' })).rejects.toThrow('Already generating');
  });

  it('refunds the charge when writing the pending state fails', async () => {
    const { uid, credits } = await setup();
    // Simulate the direction disappearing between the read and the write.
    const deletingCredits = { ...credits, charge: async (a: Parameters<typeof credits.charge>[0]) => {
      const r = await credits.charge(a);
      await db.doc(`users/${uid}/brands/b/directions/d`).delete();
      return r;
    } };
    await expect(requestSlide(db, deletingCredits, { uid, brandId: 'b', directionId: 'd', kind: 'voice', clientRequestId: 'reqFFFFFF' })).rejects.toThrow();
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS);
  });

  it('color re-pick is free', async () => {
    const { uid, credits } = await setup();
    const r = await requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'color', clientRequestId: 'reqGGGGGG', feedback: { chips: ['warmer'] } });
    expect(r).toEqual({ status: 'scheduled', chargeKey: null, cost: 0 });
  });

  it('color re-pick keeps the current palette visible while pending', async () => {
    const palette = [{ role: 'primary', hex: '#112233', name: 'Primary' }];
    const { uid, credits } = await setup({ status: 'ready', markUrl: 'https://x/m.png', slides: { color: { status: 'ready', palette } } });
    await requestSlide(db, credits, { uid, brandId: 'b', directionId: 'd', kind: 'color', clientRequestId: 'reqHHHHHH' });
    const color = (await db.doc(`users/${uid}/brands/b/directions/d`).get()).data()!.slides.color;
    expect(color.status).toBe('pending');
    expect(color.palette).toEqual(palette);
  });
});
