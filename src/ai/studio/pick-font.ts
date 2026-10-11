import { BRAND_FONTS } from '@/config/brand-fonts';
import { jevEvaluate, type JevQuestion } from '@/ai/jev';

export function buildFontQuestion(exclude: string[] = []): JevQuestion {
  const criteria: Record<string, string> = {};
  for (const f of BRAND_FONTS) if (!exclude.includes(f.name)) criteria[f.name] = `${f.category.toLowerCase()} display typeface`;
  return { type: 'choice', instructions: 'Which typeface best suits this brand name and logo direction?', criteria };
}

export async function pickFont(state: object, exclude: string[] = []): Promise<string> {
  try {
    const answers = await jevEvaluate(state, { font: buildFontQuestion(exclude) });
    const a = answers.font;
    if (a?.type === 'choice' && BRAND_FONTS.some(f => f.name === a.choice) && !exclude.includes(a.choice)) return a.choice;
  } catch (error) {
    console.error('[pick-font] Jev failed, using fallback font:', error);
  }
  if (!exclude.includes('Archivo')) return 'Archivo';
  return BRAND_FONTS.find(f => !exclude.includes(f.name))?.name ?? 'Archivo';
}
