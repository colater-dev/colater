'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Logo, Brand } from '@/lib/types';
import { BrandIdentityCard } from '@/features/brands/components';
import { LogoFeedbackForm } from '@/features/brands/components/logo-feedback-form';
import { useToast } from '@/hooks/use-toast';

export function LogoDetailClient() {
    const { brandId, logoId } = useParams();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Get current user
    const { user } = useUser();

    // Memoize document references to prevent recreation on every render
    const publicLogoRef = useMemoFirebase(
        () => doc(firestore, `brands/${brandId}/logos/${logoId}`),
        [firestore, brandId, logoId]
    );
    const { data: publicLogo, isLoading: publicLoading } = useDoc<Logo>(publicLogoRef);

    const userLogoRef = useMemoFirebase(
        () => user && !publicLogo && !publicLoading
            ? doc(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations/${logoId}`)
            : null,
        [user, publicLogo, publicLoading, firestore, brandId, logoId]
    );
    const { data: userLogo, isLoading: userLoading } = useDoc<Logo>(userLogoRef);

    // Use whichever logo was found
    const logo = publicLogo || userLogo;
    const logoLoading = publicLoading || userLoading;

    // Memoize brand document references
    const publicBrandRef = useMemoFirebase(
        () => doc(firestore, `brands/${brandId}`),
        [firestore, brandId]
    );
    const { data: publicBrand, isLoading: publicBrandLoading } = useDoc<Brand>(publicBrandRef);

    const userBrandRef = useMemoFirebase(
        () => user && !publicBrand && !publicBrandLoading
            ? doc(firestore, `users/${user.uid}/brands/${brandId}`)
            : null,
        [user, publicBrand, publicBrandLoading, firestore, brandId]
    );
    const { data: userBrand, isLoading: userBrandLoading } = useDoc<Brand>(userBrandRef);

    const brand = publicBrand || userBrand;
    const brandLoading = publicBrandLoading || userBrandLoading;

    const handleFeedbackSubmit = async (rating: number, comment: string, isAnonymous: boolean) => {
        if (!logo || !brand) return;

        try {
            const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');

            const feedbackData = {
                logoId: logoId as string,
                brandId: brandId as string,
                rating,
                comment,
                isAnonymous,
                authorName: !isAnonymous && user?.displayName ? user.displayName : undefined,
                authorId: !isAnonymous && user?.uid ? user.uid : undefined,
                createdAt: serverTimestamp(),
            };

            // Save to public feedback collection
            const feedbackRef = collection(firestore, `brands/${brandId}/logos/${logoId}/feedback`);
            await addDoc(feedbackRef, feedbackData);

            toast({
                title: 'Feedback submitted!',
                description: 'Thank you for sharing your thoughts!',
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to submit',
                description: 'Please try again later.',
            });
        }
    };

    if (logoLoading || brandLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading logo...</p>
                </div>
            </div>
        );
    }

    if (!logo || !brand) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Logo not found</h1>
                    <p className="text-muted-foreground mb-4">This logo may have been deleted or you don&apos;t have access to it.</p>
                    <Link href="/dashboard">
                        <Button>Go to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-[72px] p-4 md:p-8 mt-[60px] bg-[#f9f9f9]">
            <div className="max-w-[1600px] mx-auto">
                <div className="bg-white rounded-xl shadow-[0px_0px_8px_-4px_rgba(0,0,0,0.25),0px_0px_0px_1px_rgba(0,0,0,0.02)] p-4 md:p-8">
                    <BrandIdentityCard
                        brandId={brandId as string}
                        brandName={brand.latestName}
                        primaryTagline=""
                        logos={[logo]}
                        currentLogoIndex={0}
                        isLoadingLogos={false}
                        isGeneratingLogo={false}
                        isGeneratingConcept={false}
                        isColorizing={false}
                        isLoadingTaglines={false}
                        logoConcept={null}
                        onGenerateConcept={() => { }}
                        onConceptChange={() => { }}
                        onGenerateLogo={() => { }}
                        onColorizeLogo={() => { }}
                        onLogoIndexChange={() => { }}
                        onCritiqueLogo={() => { }}
                        isCritiquing={false}
                        onLogoFontChange={() => { }}
                        readOnly={true}
                        selectedProvider="ideogram"
                        setSelectedProvider={() => { }}
                    />

                    <div className="mt-12">
                        <LogoFeedbackForm
                            creatorName={brand.latestName}
                            onSubmit={handleFeedbackSubmit}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
