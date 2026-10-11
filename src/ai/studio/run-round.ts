import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { LogoProvider } from '@/ai/logo-models';
import type { ServerCredits } from '@/lib/server-credits';
import { STUDIO_DIRECTION_REFUND } from '@/lib/credits';
import type { DirectionBrief, DirectionConcept } from './direction-concept';
import type { Recipe } from './recipes';
import type { PaletteColor } from '@/features/studio/types';

export interface RoundDeps {
  db: Firestore;
  credits: ServerCredits;
  generateConcept(brief: DirectionBrief): Promise<DirectionConcept>;
  renderMark(provider: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }>;
  uploadMark(buffer: Buffer, contentType: string, uid: string): Promise<string>;
  pickFont(state: object): Promise<string>;
  choosePalette(args: { state: object; used: string[] }): Promise<{ name: string; colors: PaletteColor[] }>;
}

export interface RoundJob {
  uid: string;
  brandId: string;
  roundId: string;
  chargeKey: string;
  base: Omit<DirectionBrief, 'recipe'>;
  directions: { id: string; recipe: Recipe }[];
}

type PalettePick = (state: object) => Promise<{ name: string; colors: PaletteColor[] }>;

async function runDirection(deps: RoundDeps, job: RoundJob, d: { id: string; recipe: Recipe }, pickPalette: PalettePick) {
  const ref = deps.db.doc(`users/${job.uid}/brands/${job.brandId}/directions/${d.id}`);
  try {
    await ref.update({ status: 'generating', stage: 'concept', updatedAt: FieldValue.serverTimestamp() });
    const concept = await deps.generateConcept({ ...job.base, recipe: d.recipe });
    await ref.update({ concept, stage: 'mark', updatedAt: FieldValue.serverTimestamp() });
    const state = { brandName: job.base.name, pitch: job.base.pitch, idea: concept.idea, style: d.recipe.styleLean };
    const [image, fontName, palette] = await Promise.all([
      deps.renderMark(d.recipe.model, concept.markPrompt),
      deps.pickFont(state),
      pickPalette(state),
    ]);
    const markUrl = await deps.uploadMark(image.buffer, image.contentType, job.uid);
    await ref.update({
      status: 'ready', markUrl, fontName,
      paletteName: palette.name, 'slides.color': { status: 'ready', palette: palette.colors },
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 300);
    console.error(`[studio] direction ${d.id} failed:`, error);
    await ref.update({ status: 'failed', error: message, updatedAt: FieldValue.serverTimestamp() }).catch(() => {});
    await deps.credits.refund({ uid: job.uid, key: job.chargeKey, amount: STUDIO_DIRECTION_REFUND, reason: 'direction failed' }).catch(console.error);
  }
}

export async function runRound(deps: RoundDeps, job: RoundJob): Promise<void> {
  // Palettes already on this brand's page, so repeats get nudged shades. Picks run one at a time per round.
  const existing = await deps.db.collection(`users/${job.uid}/brands/${job.brandId}/directions`).where('paletteName', '!=', null).get().catch(() => null);
  const used: string[] = existing ? existing.docs.map(x => x.data().paletteName as string) : [];
  let chain: Promise<unknown> = Promise.resolve();
  const pickPalette: PalettePick = state => {
    const next = chain.then(async () => {
      const r = await deps.choosePalette({ state, used: [...used] });
      used.push(r.name);
      return r;
    });
    chain = next.catch(() => undefined);
    return next;
  };
  await Promise.all(job.directions.map(d => runDirection(deps, job, d, pickPalette)));
}
