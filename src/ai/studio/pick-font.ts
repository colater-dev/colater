import { BRAND_FONTS } from '@/config/brand-fonts';
import { jevEvaluate, type JevQuestion } from '@/ai/jev';

export function buildFontQuestion(): JevQuestion {
  const criteria: Record<string, string> = {};
  for (const f of BRAND_FONTS) criteria[f.name] = `${f.category.toLowerCase()} display typeface`;
  return { type: 'choice', instructions: 'Which typeface best suits this brand name and logo direction?', criteria };
}

export async function pickFont(state: object): Promise<string> {
  try {
    const answers = await jevEvaluate(state, { font: buildFontQuestion() });
    const a = answers.font;
    if (a?.type === 'choice' && BRAND_FONTS.some(f => f.name === a.choice)) return a.choice;
  } catch (error) {
    console.error('[pick-font] Jev failed, using fallback font:', error);
  }
  return 'Archivo';
}
