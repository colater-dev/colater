/** Where a brand opens. Studio brands have no legacy logos, so the old editor/presentation can't show them. */
export function brandHref(brand: { id: string; source?: string }, view: 'present' | 'edit' = 'present'): string {
  if (brand.source === 'studio') return `/studio/${brand.id}`;
  return view === 'present' ? `/brands/${brand.id}/presentation` : `/brands/${brand.id}`;
}
