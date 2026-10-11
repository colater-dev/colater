import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { LogoProvider } from '@/ai/logo-models';
import type { ServerCredits } from '@/lib/server-credits';
import type { GenerateKind, PaletteColor } from '@/features/studio/types';
import type { DirectionBrief, DirectionConcept } from './direction-concept';
import type { SlideBrief } from './palette';

export interface SlideDeps {
  db: Firestore;
  credits: ServerCredits;
  generatePalette(b: SlideBrief): Promise<PaletteColor[]>;
  generateVoice(b: SlideBrief): Promise<{ tagline: string; story: string }>;
  vectorizeMark(url: string): Promise<{ buffer: Buffer; contentType: string }>;
  upload(buffer: Buffer, contentType: string, uid: string): Promise<string>;
  generateConcept(b: DirectionBrief): Promise<DirectionConcept>;
  renderMark(provider: LogoProvider, prompt: string): Promise<{ buffer: Buffer; contentType: string }>;
  pickFont(state: object, exclude?: string[]): Promise<string>;
}

export interface SlideJob {
  uid: string;
  brandId: string;
  directionId: string;
  kind: GenerateKind;
  chargeKey: string | null;
  cost: number;
  brief: Omit<DirectionBrief, 'recipe'>;
  feedback?: { chips: string[]; note?: string };
}

export async function runSlide(deps: SlideDeps, job: SlideJob): Promise<void> {
  const ref = deps.db.doc(`users/${job.uid}/brands/${job.brandId}/directions/${job.directionId}`);
  const now = () => FieldValue.serverTimestamp();
  let hadMark = false;
  try {
    const d = (await ref.get()).data();
    hadMark = !!d?.markUrl;
    if (!d) throw new Error('Direction not found');
    const slideBrief: SlideBrief = { ...job.brief, idea: d.concept?.idea ?? job.brief.pitch, feedback: job.feedback };

    switch (job.kind) {
      case 'color': {
        const palette = await deps.generatePalette(slideBrief);
        await ref.update({ 'slides.color': { status: 'ready', palette }, updatedAt: now() });
        return;
      }
      case 'voice': {
        const voice = await deps.generateVoice(slideBrief);
        await ref.update({ 'slides.voice': { status: 'ready', ...voice }, updatedAt: now() });
        return;
      }
      case 'vector': {
        if (!d.markUrl) throw new Error('No mark to vectorize');
        const svg = await deps.vectorizeMark(d.markUrl);
        const svgUrl = await deps.upload(svg.buffer, svg.contentType, job.uid);
        await ref.update({ 'slides.vector': { status: 'ready', svgUrl }, updatedAt: now() });
        return;
      }
      case 'mark': {
        await ref.update({ status: 'generating', stage: 'concept', updatedAt: now() });
        const feedbackChips = [...(job.feedback?.chips ?? []), ...(job.feedback?.note ? [job.feedback.note] : [])];
        const concept = await deps.generateConcept({ ...job.brief, recipe: d.recipe, feedbackChips, seedIdea: d.concept?.idea });
        await ref.update({ concept, stage: 'mark', updatedAt: now() });
        const image = await deps.renderMark(d.recipe.model, concept.markPrompt);
        const markUrl = await deps.upload(image.buffer, image.contentType, job.uid);
        await ref.update({ status: 'ready', markUrl, redoError: FieldValue.delete(), 'slides.vector': FieldValue.delete(), updatedAt: now() });
        return;
      }
      case 'lockup': {
        const fontName = await deps.pickFont({ brandName: job.brief.name, idea: slideBrief.idea, feedback: job.feedback?.chips }, d.fontName ? [d.fontName] : []);
        await ref.update({ fontName, updatedAt: now() });
        return;
      }
    }
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 300);
    console.error(`[studio] slide ${job.kind} on ${job.directionId} failed:`, error);
    const failure = job.kind === 'mark'
      ? hadMark
        ? { status: 'ready', stage: 'mark', redoError: message } // keep the existing mark visible
        : { status: 'failed', error: message }
      : job.kind === 'lockup'
        ? {}
        : { [`slides.${job.kind}.status`]: 'failed', [`slides.${job.kind}.error`]: message };
    await ref.update({ ...failure, updatedAt: now() }).catch(() => {});
    if (job.chargeKey && job.cost > 0) {
      await deps.credits.refund({ uid: job.uid, key: job.chargeKey, amount: job.cost, reason: `${job.kind} failed` }).catch(console.error);
    }
  }
}
