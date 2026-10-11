/** Preset tags users pick from on the Studio start screen (no free text). */
export type TagGroup = 'audience' | 'style';

export interface BrandTag {
  id: string;
  label: string;
}

export const AUDIENCE_TAGS: readonly BrandTag[] = [
  { id: 'gen_z', label: 'Gen Z' },
  { id: 'millennials', label: 'Millennials' },
  { id: 'families', label: 'Families' },
  { id: 'students', label: 'Students' },
  { id: 'professionals', label: 'Professionals' },
  { id: 'small_business', label: 'Small businesses' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'developers', label: 'Developers' },
  { id: 'creatives', label: 'Creatives' },
  { id: 'health_conscious', label: 'Health-conscious' },
  { id: 'outdoor', label: 'Outdoor lovers' },
  { id: 'luxury_buyers', label: 'Luxury buyers' },
  { id: 'budget_minded', label: 'Budget-minded' },
  { id: 'local_community', label: 'Local community' },
  { id: 'seniors', label: 'Seniors' },
  { id: 'kids', label: 'Kids' },
  { id: 'teens', label: 'Teens' },
  { id: 'young_professionals', label: 'Young professionals' },
  { id: 'parents', label: 'Parents' },
  { id: 'founders', label: 'Founders' },
  { id: 'remote_workers', label: 'Remote workers' },
  { id: 'designers', label: 'Designers' },
  { id: 'healthcare_workers', label: 'Healthcare workers' },
  { id: 'educators', label: 'Educators' },
  { id: 'tradespeople', label: 'Tradespeople' },
  { id: 'homeowners', label: 'Homeowners' },
  { id: 'fitness_fans', label: 'Fitness fans' },
  { id: 'athletes', label: 'Athletes' },
  { id: 'foodies', label: 'Foodies' },
  { id: 'travellers', label: 'Travellers' },
  { id: 'gamers', label: 'Gamers' },
  { id: 'music_lovers', label: 'Music lovers' },
  { id: 'pet_owners', label: 'Pet owners' },
  { id: 'book_lovers', label: 'Book lovers' },
  { id: 'hobbyists', label: 'Hobbyists' },
  { id: 'eco_minded', label: 'Eco-minded' },
  { id: 'tourists', label: 'Tourists' },
  { id: 'collectors', label: 'Collectors' },
  { id: 'b2b_buyers', label: 'B2B buyers' },
  { id: 'nonprofits', label: 'Nonprofits' },
];

export const STYLE_TAGS: readonly BrandTag[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'playful', label: 'Playful' },
  { id: 'bold', label: 'Bold' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'organic', label: 'Organic' },
  { id: 'techy', label: 'Techy' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'premium', label: 'Premium' },
  { id: 'retro', label: 'Retro' },
  { id: 'handcrafted', label: 'Handcrafted' },
  { id: 'serious', label: 'Serious' },
  { id: 'warm', label: 'Warm' },
  { id: 'edgy', label: 'Edgy' },
  { id: 'calm', label: 'Calm' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'confident', label: 'Confident' },
  { id: 'cheeky', label: 'Cheeky' },
  { id: 'quirky', label: 'Quirky' },
  { id: 'whimsical', label: 'Whimsical' },
  { id: 'rebellious', label: 'Rebellious' },
  { id: 'trustworthy', label: 'Trustworthy' },
  { id: 'optimistic', label: 'Optimistic' },
  { id: 'sophisticated', label: 'Sophisticated' },
  { id: 'expressive', label: 'Expressive' },
  { id: 'sporty', label: 'Sporty' },
  { id: 'natural', label: 'Natural' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'sharp', label: 'Sharp' },
  { id: 'chunky', label: 'Chunky' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'y2k', label: 'Y2K' },
  { id: 'art_deco', label: 'Art deco' },
  { id: 'brutalist', label: 'Brutalist' },
  { id: 'scandinavian', label: 'Scandinavian' },
  { id: 'japanese_inspired', label: 'Japanese-inspired' },
  { id: 'luxurious', label: 'Luxurious' },
  { id: 'approachable', label: 'Approachable' },
  { id: 'underground', label: 'Underground' },
];

export const AUDIENCE_MAX = 8;
export const STYLE_MAX = 6;

const GROUPS: Record<TagGroup, readonly BrandTag[]> = { audience: AUDIENCE_TAGS, style: STYLE_TAGS };

export function isTagInGroup(group: TagGroup, id: string): boolean {
  return GROUPS[group].some(t => t.id === id);
}

export function tagLabel(id: string): string {
  return [...AUDIENCE_TAGS, ...STYLE_TAGS].find(t => t.id === id)?.label ?? id;
}

/** Tags ordered by how well they fit the brand (Jev scores), best first; unscored keep their order at the end. */
export function sortTagsByScore(tags: readonly BrandTag[], scores: Record<string, number>): BrandTag[] {
  return tags
    .map((t, i) => ({ t, i, s: scores[t.id] }))
    .sort((a, b) => (b.s ?? -1) - (a.s ?? -1) || a.i - b.i)
    .map(x => x.t);
}
