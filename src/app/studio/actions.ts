'use server';

import { after } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/firebase/server';
import { requireServerAuth } from '@/lib/server-auth';
import { createServerCredits, InsufficientCreditsError } from '@/lib/server-credits';
import { studioRoundCost } from '@/lib/credits';
import { isTagInGroup, tagLabel } from '@/lib/brand-tags';
import { ELEVATOR_PITCH_MAX } from '@/lib/brand-limits';
import { buildTagQuestions, selectSuggestedTags } from '@/lib/tag-suggestions';
import { jevEvaluate } from '@/ai/jev';
import { pickRecipes } from '@/ai/studio/recipes';
import { generateDirectionConcept } from '@/ai/studio/direction-concept';
import { renderMark } from '@/ai/studio/render-mark';
import { pickFont } from '@/ai/studio/pick-font';
import { uploadBufferToR2 } from '@/lib/r2-server';
import { runRound } from '@/ai/studio/run-round';
import { createRound } from '@/ai/studio/create-round';
import { toggleFavorite } from '@/ai/studio/toggle-favorite';
import { sweepStaleDirections } from '@/ai/studio/sweep-stale';
import { ROUND_FEEDBACK_CHIPS, SLIDE_FEEDBACK_CHIPS, type GenerateKind } from '@/features/studio/types';
import { requestSlide } from '@/ai/studio/request-slide';
import { runSlide } from '@/ai/studio/run-slide';
import { choosePalette } from '@/ai/studio/palette-picker';
import { findStickerBackground } from '@/ai/studio/sticker-background';
import { generateVoice } from '@/ai/studio/voice';
import { vectorizeMark } from '@/ai/studio/vectorize-mark';

type Result<T> = { success: boolean; data?: T; error?: string; insufficient?: boolean; needed?: number; balance?: number };
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
  pitch: z.string().trim().min(5).max(ELEVATOR_PITCH_MAX),
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
  options: { feedbackChips?: string[]; seedDirectionId?: string; count?: 1 | 3 } = {}
): Promise<Result<{ roundId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(clientRoundId)) return { success: false, error: 'Invalid id' };
    const brandRef = adminDb.doc(`users/${uid}/brands/${brandId}`);
    const brandSnap = await brandRef.get();
    if (!brandSnap.exists) return { success: false, error: 'Brand not found' };
    const brand = brandSnap.data()!;

    const credits = createServerCredits(adminDb);
    await sweepStaleDirections(adminDb, credits, { uid, brandId }).catch(console.error);

    const feedbackChips = (options.feedbackChips ?? []).filter(c => (ROUND_FEEDBACK_CHIPS as readonly string[]).includes(c));
    const seedDirectionId = options.seedDirectionId && ID.test(options.seedDirectionId) ? options.seedDirectionId : null;
    const seedIdea: string | undefined = seedDirectionId
      ? (await brandRef.collection('directions').doc(seedDirectionId).get()).data()?.concept?.idea
      : undefined;

    const count = options.count === 1 ? 1 : 3;
    const recent = count === 1
      ? (await brandRef.collection('directions').orderBy('createdAt', 'desc').limit(6).get()).docs.map(d => d.data().recipe).filter(Boolean)
      : [];

    let created;
    try {
      created = await createRound(adminDb, credits, {
        uid, brandId, clientRoundId, feedbackChips, seedDirectionId,
        recipes: pickRecipes(brand.styleTags ?? [], Math.random, { count, avoid: recent }),
        cost: studioRoundCost(count),
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return { success: false, insufficient: true, needed: error.needed, balance: error.balance, error: `This needs ${error.needed} credits; you have ${error.balance}.` };
      }
      throw error;
    }
    if (created.status === 'exists') return { success: true, data: { roundId: clientRoundId } };
    const { chargeKey, directions } = created;

    after(() =>
      runRound(
        {
          db: adminDb,
          credits,
          generateConcept: generateDirectionConcept,
          renderMark,
          uploadMark: (buffer, contentType, owner) => uploadBufferToR2(buffer, contentType, `studio/${owner}`),
          pickFont,
          choosePalette: args => choosePalette(args),
          stickerBackground: (surface, owner) => findStickerBackground(surface, owner, { upload: (buffer, contentType, o) => uploadBufferToR2(buffer, contentType, `studio/${o}`) }),
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

export async function favoriteDirection(idToken: string, brandId: string, directionId: string): Promise<Result<{ favorite: boolean }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(directionId)) return { success: false, error: 'Invalid id' };
    return { success: true, data: { favorite: await toggleFavorite(adminDb, { uid, brandId, directionId }) } };
  } catch (error) {
    return fail(error);
  }
}

/** Called when the Studio page opens: fails + refunds directions whose background work died. */
export async function sweepStudio(idToken: string, brandId: string): Promise<Result<{ swept: number }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId)) return { success: false, error: 'Invalid id' };
    const swept = await sweepStaleDirections(adminDb, createServerCredits(adminDb), { uid, brandId });
    return { success: true, data: { swept } };
  } catch (error) {
    return fail(error);
  }
}

const GENERATE_KINDS: readonly GenerateKind[] = ['color', 'voice', 'vector', 'mark', 'lockup'];

export async function generateSlide(
  idToken: string,
  brandId: string,
  directionId: string,
  kind: GenerateKind,
  clientRequestId: string,
  feedback?: { chips: string[]; note?: string }
): Promise<Result<{ directionId: string }>> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!ID.test(brandId) || !ID.test(directionId) || !ID.test(clientRequestId)) return { success: false, error: 'Invalid id' };
    if (!GENERATE_KINDS.includes(kind)) return { success: false, error: 'Unknown slide' };
    const allowedChips: readonly string[] = (SLIDE_FEEDBACK_CHIPS as Record<string, readonly string[]>)[kind] ?? [];
    const cleanFeedback = feedback
      ? { chips: feedback.chips.filter(c => allowedChips.includes(c)), note: feedback.note?.trim().slice(0, 200) || undefined }
      : undefined;

    const brand = (await adminDb.doc(`users/${uid}/brands/${brandId}`).get()).data();
    if (!brand) return { success: false, error: 'Brand not found' };

    const credits = createServerCredits(adminDb);
    let req;
    try {
      req = await requestSlide(adminDb, credits, { uid, brandId, directionId, kind, clientRequestId, feedback: cleanFeedback });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return { success: false, insufficient: true, needed: error.needed, balance: error.balance, error: `This needs ${error.needed} credits; you have ${error.balance}.` };
      }
      throw error;
    }
    if (req.status === 'duplicate') return { success: true, data: { directionId } };

    after(() =>
      runSlide(
        {
          db: adminDb, credits, choosePalette: args => choosePalette(args), generateVoice, vectorizeMark,
          upload: (buffer, contentType, owner) => uploadBufferToR2(buffer, contentType, `studio/${owner}`),
          generateConcept: generateDirectionConcept, renderMark, pickFont,
        },
        {
          uid, brandId, directionId, kind, chargeKey: req.chargeKey, cost: req.cost, feedback: cleanFeedback,
          brief: { name: brand.latestName, pitch: brand.latestElevatorPitch, audienceTags: brand.audienceTags ?? [], styleTags: brand.styleTags ?? [] },
        }
      )
    );
    return { success: true, data: { directionId } };
  } catch (error) {
    return fail(error);
  }
}
