import { StudioClient } from './studio-client';

export const maxDuration = 300;
export const metadata = { title: 'Studio' };

export default async function StudioPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  return <StudioClient brandId={brandId} />;
}
