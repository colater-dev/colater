import { LOGO_MODELS, type LogoProvider } from '@/ai/logo-models';

export const IDEA_TYPES = ['literal-symbol', 'abstract-geometric', 'lettermark', 'negative-space'] as const;
export type IdeaType = (typeof IDEA_TYPES)[number];

export const IDEA_TYPE_GUIDANCE: Record<IdeaType, string> = {
  'literal-symbol': 'A simplified, recognizable object or creature that directly represents what the brand does.',
  'abstract-geometric': 'An abstract mark built from a few geometric shapes that evokes the brand feeling rather than depicting an object.',
  lettermark: "A monogram built from the brand name's first letter (or two initials), shaped to carry the brand idea.",
  'negative-space': 'A mark where a second meaningful shape appears in the empty space inside or between the main forms.',
};

export interface Recipe {
  ideaType: IdeaType;
  styleLean: string;
  model: LogoProvider;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Diverse recipes. Three: every model once, three different idea types, style leans spread over the user's tags.
 * One: a random idea/model combo the brand hasn't used recently (falls back to any combo).
 */
export function pickRecipes(
  styleTags: string[],
  random: () => number = Math.random,
  { count = 3, avoid = [] }: { count?: 1 | 3; avoid?: Pick<Recipe, 'ideaType' | 'model'>[] } = {}
): Recipe[] {
  if (count === 1) {
    const combos = IDEA_TYPES.flatMap(ideaType => (Object.keys(LOGO_MODELS) as LogoProvider[]).map(model => ({ ideaType, model })));
    const fresh = combos.filter(c => !avoid.some(a => a.ideaType === c.ideaType && a.model === c.model));
    const pool = fresh.length ? fresh : combos;
    const pick = pool[Math.floor(random() * pool.length)];
    const leans = styleTags.length ? styleTags : ['minimal'];
    return [{ ...pick, styleLean: leans[Math.floor(random() * leans.length)] }];
  }
  const models = shuffle(Object.keys(LOGO_MODELS) as LogoProvider[], random);
  const ideas = shuffle(IDEA_TYPES, random).slice(0, 3);
  const leans = styleTags.length ? shuffle(styleTags, random) : ['minimal'];
  return [0, 1, 2].map(i => ({ ideaType: ideas[i], model: models[i], styleLean: leans[i % leans.length] }));
}
