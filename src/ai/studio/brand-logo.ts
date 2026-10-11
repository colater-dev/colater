import type { Firestore, Timestamp } from 'firebase-admin/firestore';

/**
 * Keeps a Studio brand's `logoUrl` (and `font`), which the dashboard shows, in step with its
 * directions: the newest favorite, otherwise the newest ready mark. Returns whether it changed.
 */
export async function syncBrandLogo(db: Firestore, a: { uid: string; brandId: string }): Promise<boolean> {
  const brandRef = db.doc(`users/${a.uid}/brands/${a.brandId}`);
  const snap = await brandRef.collection('directions').where('status', '==', 'ready').get();
  const ready = snap.docs
    .map(d => d.data())
    .filter(d => typeof d.markUrl === 'string')
    .sort((x, y) => ((y.createdAt as Timestamp | undefined)?.toMillis() ?? 0) - ((x.createdAt as Timestamp | undefined)?.toMillis() ?? 0));
  const pick = ready.find(d => d.favorite) ?? ready[0];
  if (!pick) return false;
  const brand = (await brandRef.get()).data() ?? {};
  if (brand.logoUrl === pick.markUrl && (!pick.fontName || brand.font === pick.fontName)) return false;
  await brandRef.update({ logoUrl: pick.markUrl, ...(pick.fontName ? { font: pick.fontName } : {}) });
  return true;
}

/** Brings every Studio brand of a user up to date (legacy brands manage their own logo). */
export async function syncStudioLogos(db: Firestore, uid: string): Promise<number> {
  const brands = await db.collection(`users/${uid}/brands`).where('source', '==', 'studio').get();
  const changed = await Promise.all(brands.docs.map(b => syncBrandLogo(db, { uid, brandId: b.id }).catch(() => false)));
  return changed.filter(Boolean).length;
}
