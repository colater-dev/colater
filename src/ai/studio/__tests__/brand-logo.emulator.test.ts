import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { syncBrandLogo, syncStudioLogos } from '../brand-logo';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;
const at = (s: number) => Timestamp.fromMillis(1_700_000_000_000 + s * 1000);

describe.skipIf(!ON)('brand logo sync (emulator)', () => {
  let db: Firestore;
  beforeAll(() => {
    const app = getApps().find(a => a.name === 'brand-logo-test') ?? initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'brand-logo-test');
    db = getFirestore(app);
  });
  const setup = async (dirs: Record<string, Record<string, unknown>>, brand: Record<string, unknown> = { source: 'studio', latestName: 'B' }) => {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    await db.doc(`users/${uid}/brands/b`).set(brand);
    for (const [id, d] of Object.entries(dirs)) await db.doc(`users/${uid}/brands/b/directions/${id}`).set(d);
    return { uid, brand: () => db.doc(`users/${uid}/brands/b`).get().then(s => s.data()!) };
  };

  it('uses the newest ready mark when nothing is favorited, with its font', async () => {
    const { uid, brand } = await setup({
      old: { status: 'ready', markUrl: 'https://r2/old.png', fontName: 'Archivo', createdAt: at(1) },
      new: { status: 'ready', markUrl: 'https://r2/new.png', fontName: 'Caprasimo', createdAt: at(2) },
      gen: { status: 'generating', createdAt: at(3) },
    });
    await syncBrandLogo(db, { uid, brandId: 'b' });
    expect(await brand()).toMatchObject({ logoUrl: 'https://r2/new.png', font: 'Caprasimo' });
  });

  it('prefers the newest favorite', async () => {
    const { uid, brand } = await setup({
      fav: { status: 'ready', markUrl: 'https://r2/fav.png', favorite: true, createdAt: at(1) },
      new: { status: 'ready', markUrl: 'https://r2/new.png', createdAt: at(2) },
    });
    await syncBrandLogo(db, { uid, brandId: 'b' });
    expect((await brand()).logoUrl).toBe('https://r2/fav.png');
  });

  it('leaves a brand with no ready marks alone', async () => {
    const { uid, brand } = await setup({ gen: { status: 'generating', createdAt: at(1) } });
    await syncBrandLogo(db, { uid, brandId: 'b' });
    expect((await brand()).logoUrl).toBeUndefined();
  });

  it('backfills every studio brand of a user, and never touches legacy brands', async () => {
    const { uid, brand } = await setup({ d: { status: 'ready', markUrl: 'https://r2/d.png', createdAt: at(1) } });
    await db.doc(`users/${uid}/brands/legacy`).set({ latestName: 'L', logoUrl: 'https://legacy/logo.png' });
    await db.doc(`users/${uid}/brands/legacy/directions/x`).set({ status: 'ready', markUrl: 'https://r2/x.png', createdAt: at(1) });
    expect(await syncStudioLogos(db, uid)).toBe(1);
    expect((await brand()).logoUrl).toBe('https://r2/d.png');
    expect((await db.doc(`users/${uid}/brands/legacy`).get()).data()?.logoUrl).toBe('https://legacy/logo.png');
  });
});
