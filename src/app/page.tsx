import { Metadata } from 'next';
import { LandingPageClient } from './landing-page-client';

const title = 'Clarify your brand. Generate on-brand assets.';
const description =
  'Agentic AI that helps you define your positioning, create professional visual assets, and keep every touchpoint on-brand.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} | Colater`, description },
  twitter: { card: 'summary_large_image', title: `${title} | Colater`, description },
};

export default function Home() {
  return <LandingPageClient />;
}
