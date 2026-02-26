import { Metadata } from 'next';
import { LogoDetailClient } from './logo-detail-client';

type Props = {
    params: Promise<{ brandId: string; logoId: string }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    await params;

    return {
        title: 'Logo Generation',
        description: 'View and share this AI-generated logo identity',
        openGraph: {
            title: 'Logo Generation | Colater',
            description: 'View and share this AI-generated logo identity',
            images: ['https://colater.ai/og-image.png'],
        },
        twitter: {
            title: 'Logo Generation | Colater',
            description: 'View and share this AI-generated logo identity',
            images: ['https://colater.ai/og-image.png'],
        },
    };
}

export default function LogoPage() {
    return <LogoDetailClient />;
}
