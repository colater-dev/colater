import { Metadata } from 'next';
import { BrandDetailClient } from './brand-detail-client';

type Props = {
  params: Promise<{ brandId: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  await params;

  return {
    title: 'Brand Identity',
    description: 'Design and manage your brand identity',
    openGraph: {
      title: 'Brand Identity | Colater',
      description: 'Design and manage your brand identity',
      images: ['https://colater.ai/og-image.png'],
    },
    twitter: {
      title: 'Brand Identity | Colater',
      description: 'Design and manage your brand identity',
      images: ['https://colater.ai/og-image.png'],
    },
  };
}

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function BrandPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-4 min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BrandDetailClient />
    </Suspense>
  );
}
