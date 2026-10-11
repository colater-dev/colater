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
];

const GROUPS: Record<TagGroup, readonly BrandTag[]> = { audience: AUDIENCE_TAGS, style: STYLE_TAGS };

export function isTagInGroup(group: TagGroup, id: string): boolean {
  return GROUPS[group].some(t => t.id === id);
}

export function tagLabel(id: string): string {
  return [...AUDIENCE_TAGS, ...STYLE_TAGS].find(t => t.id === id)?.label ?? id;
}
