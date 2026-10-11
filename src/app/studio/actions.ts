'use server';

import { after } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/firebase/server';
import { requireServerAuth } from '@/lib/server-auth';
import { createServerCredits, InsufficientCreditsError } from '@/lib/server-credits';
import { CREDIT_COSTS } from '@/lib/credits';
import { isTagInGroup, tagLabel } from '@/lib/brand-tags';
import { buildTagQuestions, selectSuggestedTags } from '@/lib/tag-suggestions';
import { jevEvaluate } from '@/ai/jev';
import { pickRecipes } from '@/ai/studio/recipes';
import { generateDirectionConcept } from '@/ai/studio/direction-concept';
import { renderMark } from '@/ai/studio/render-mark';
import { pickFont } from '@/ai/studio/pick-font';
import { uploadBufferToR2 } from '@/lib/r2-server';
import { runRound } from '@/ai/studio/run-round';
import { ROUND_FEEDBACK_CHIPS } from '@/features/studio/types';

type Result<T> = { success: boolean; data?: T; error?: string; insufficient?: boolean };
const fail = (error: unknown): Result<never> => ({ success: false, error: error instanceof Error ? error.message : 'Something went wrong' });

export async function suggestTags(idToken: string, name: string, pitch: string): Promise<Result<{ audience: string[]; style: string[] }>> {
  try {
    await requireServerAuth(idToken);
    if (!name.trim() || pitch.trim().length < 5) return { success: true, data: { audience: [], style: [] } };
    try {
      const answers = await jevEvaluate({ brandName: name.trim(), whatItDoes: pitch.trim() }, buildTagQuestions());
      return { success: true, data: selectSuggestedTags(answers) };
    } catch (error) {
      console.error('[studio] tag suggestion failed:', error);
      return { success: true, data: { audience: [], style: [] } };
    }
  } catch (error) {
    return fail(error);
  }
}

const BrandInput = z.object({
  name: z.string().trim().min(1).max(60),
  pitch: z.string().trim().min(5).max(200),
  audienceTags: z.array(z.string()).min(1).max(5).refine(t => t.every(id => isTagInGroup('audience', id)), 'Unknown audience tag'),
  styleTags: z.array(z.string()).min(1).max(5).refine(t => t.every(id => isTagInGroup('style', id)), 'Unknown style tag'),
});

export async function createStudioBrand(idToken: string, input: z.infer<typeof BrandInput>): Promise<Result<{ brandId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    const parsed = BrandInput.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    const b = parsed.data;
    const ref = await adminDb.collection(`users/${uid}/brands`).add({
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
      source: 'studio',
      latestName: b.name,
      latestElevatorPitch: b.pitch,
      latestAudience: b.audienceTags.map(tagLabel).join(', '),
      latestDesirableCues: b.styleTags.map(tagLabel).join(', '),
      latestUndesirableCues: '',
      audienceTags: b.audienceTags,
      styleTags: b.styleTags,
    });
    return { success: true, data: { brandId: ref.id } };
  } catch (error) {
    return fail(error);
  }
}

const ID = /^[A-Za-z0-9_-]{8,64}$/;

export async function startRound(
  idToken: string,
  brandId: string,
  clientRoundId: string,
  options: { feedbackChips?: string[]; seedDirectionId?: string } = {}
): Promise<Result<{ roundId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(clientRoundId)) return { success: false, error: 'Invalid id' };
    const brandRef = adminDb.doc(`users/${uid}/brands/${brandId}`);
    const brandSnap = await brandRef.get();
    if (!brandSnap.exists) return { success: false, error: 'Brand not found' };
    const brand = brandSnap.data()!;

    const roundRef = brandRef.collection('rounds').doc(clientRoundId);
    if ((await roundRef.get()).exists) return { success: true, data: { roundId: clientRoundId } };

    const feedbackChips = (options.feedbackChips ?? []).filter(c => (ROUND_FEEDBACK_CHIPS as readonly string[]).includes(c));
    let seedIdea: string | undefined;
    if (options.seedDirectionId && ID.test(options.seedDirectionId)) {
      seedIdea = (await brandRef.collection('directions').doc(options.seedDirectionId).get()).data()?.concept?.idea;
    }

    const credits = createServerCredits(adminDb);
    const chargeKey = `round_${brandId}_${clientRoundId}`;
    try {
      await credits.charge({ uid, amount: CREDIT_COSTS.studioRound, action: 'studioRound', key: chargeKey });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) return { success: false, insufficient: true, error: `This needs ${error.needed} credits; you have ${error.balance}.` };
      throw error;
    }

    const recipes = pickRecipes(brand.styleTags ?? []);
    const batch = adminDb.batch();
    batch.create(roundRef, { createdAt: FieldValue.serverTimestamp(), feedbackChips, seedDirectionId: options.seedDirectionId ?? null });
    const directions = recipes.map((recipe, order) => {
      const ref = brandRef.collection('directions').doc();
      batch.create(ref, { roundId: clientRoundId, order, recipe, status: 'pending', picked: false, createdAt: FieldValue.serverTimestamp() });
      return { id: ref.id, recipe };
    });
    await batch.commit();

    after(() =>
      runRound(
        {
          db: adminDb,
          credits,
          generateConcept: generateDirectionConcept,
          renderMark,
          uploadMark: (buffer, contentType, owner) => uploadBufferToR2(buffer, contentType, `studio/${owner}`),
          pickFont,
        },
        {
          uid, brandId, roundId: clientRoundId, chargeKey,
          base: { name: brand.latestName, pitch: brand.latestElevatorPitch, audienceTags: brand.audienceTags ?? [], styleTags: brand.styleTags ?? [], feedbackChips, seedIdea },
          directions,
        }
      )
    );

    return { success: true, data: { roundId: clientRoundId } };
  } catch (error) {
    return fail(error);
  }
}

export async function pickDirection(idToken: string, brandId: string, directionId: string): Promise<Result<{ directionId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(directionId)) return { success: false, error: 'Invalid id' };
    const dirs = adminDb.collection(`users/${uid}/brands/${brandId}/directions`);
    const picked = await dirs.doc(directionId).get();
    if (!picked.exists) return { success: false, error: 'Direction not found' };
    const siblings = await dirs.where('roundId', '==', picked.data()!.roundId).get();
    const batch = adminDb.batch();
    siblings.docs.forEach(d => batch.update(d.ref, { picked: d.id === directionId, pickedAt: d.id === directionId ? FieldValue.serverTimestamp() : null }));
    batch.create(adminDb.collection('events').doc(), { type: 'picked', uid, brandId, directionId, recipe: picked.data()!.recipe, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return { success: true, data: { directionId } };
  } catch (error) {
    return fail(error);
  }
}
