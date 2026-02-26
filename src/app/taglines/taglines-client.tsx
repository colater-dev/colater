'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    collection,
    serverTimestamp,
    query,
    orderBy,
    updateDoc,
    doc,
    writeBatch,
    getDocs,
} from 'firebase/firestore';
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { getTaglineSuggestions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createBrandService } from '@/services';
import { TaglinesList } from '@/features/brands/components';
import { ContentCard } from '@/components/layout';
import { Loader2 } from 'lucide-react';
import type { Brand, Tagline } from '@/lib/types';
import { useRequireAuth } from '@/features/auth/hooks';

export function TaglinesClient() {
    const { user, isLoading: isLoadingAuth } = useRequireAuth();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isGeneratingTaglines, setIsGeneratingTaglines] = useState(false);

    const selectedBrandId = searchParams.get('brandId');
    const brandService = useMemo(() => createBrandService(firestore), [firestore]);

    const brandsQuery = useMemoFirebase(
        () => user ? brandService.getBrandsQuery(user.uid) : null,
        [user, brandService]
    );
    const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);

    const brandRef = useMemoFirebase(
        () =>
            user && selectedBrandId
                ? brandService.getBrandDoc(user.uid, selectedBrandId)
                : null,
        [user, brandService, selectedBrandId]
    );
    const { data: selectedBrand, isLoading: isLoadingSelectedBrand } = useDoc<Brand>(brandRef);

    const taglinesQuery = useMemoFirebase(
        () =>
            user && selectedBrandId
                ? query(
                    collection(
                        firestore,
                        `users/${user.uid}/brands/${selectedBrandId}/taglineGenerations`
                    ),
                    orderBy('createdAt', 'desc')
                )
                : null,
        [user, firestore, selectedBrandId]
    );
    const { data: allTaglines, isLoading: isLoadingTaglines } =
        useCollection<Tagline>(taglinesQuery);

    const handleGenerateTaglines = useCallback(async () => {
        if (!selectedBrand || !user) return;
        setIsGeneratingTaglines(true);

        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            const suggestionResult = await getTaglineSuggestions(
                idToken,
                selectedBrand.latestName,
                selectedBrand.latestElevatorPitch,
                selectedBrand.latestAudience,
                selectedBrand.latestDesirableCues,
                selectedBrand.latestUndesirableCues
            );

            if (suggestionResult.success && suggestionResult.data) {
                const taglinesCollection = collection(
                    firestore,
                    `users/${user.uid}/brands/${selectedBrandId}/taglineGenerations`
                );
                suggestionResult.data.forEach((tagline) => {
                    addDocumentNonBlocking(taglinesCollection, {
                        brandId: selectedBrandId,
                        userId: user.uid,
                        tagline,
                        createdAt: serverTimestamp(),
                        status: 'generated',
                    });
                });
                toast({
                    title: 'New taglines generated!',
                    description: 'They have been added to your list.',
                });
            } else {
                throw new Error(suggestionResult.error || 'Failed to get tagline suggestions.');
            }
        } catch (error) {
            console.error('Error generating taglines:', error);
            toast({
                variant: 'destructive',
                title: 'Tagline Generation Failed',
                description:
                    error instanceof Error ? error.message : 'Could not generate new taglines.',
            });
        } finally {
            setIsGeneratingTaglines(false);
        }
    }, [selectedBrand, user, selectedBrandId, firestore, toast, auth]);

    const handleTaglineStatusUpdate = useCallback(
        async (taglineId: string, status: 'liked' | 'disliked') => {
            if (!user || !selectedBrandId) return;
            try {
                if (status === 'liked') {
                    const taglinesCollection = collection(
                        firestore,
                        `users/${user.uid}/brands/${selectedBrandId}/taglineGenerations`
                    );
                    const snapshot = await getDocs(taglinesCollection);
                    const batch = writeBatch(firestore);
                    snapshot.forEach((docSnap) => {
                        const ref = doc(
                            firestore,
                            `users/${user.uid}/brands/${selectedBrandId}/taglineGenerations/${docSnap.id}`
                        );
                        if (docSnap.id === taglineId) {
                            batch.update(ref, { status: 'liked' });
                        } else if ((docSnap.data() as any).status === 'liked') {
                            batch.update(ref, { status: 'generated' });
                        }
                    });
                    await batch.commit();
                } else {
                    const taglineRef = doc(
                        firestore,
                        `users/${user.uid}/brands/${selectedBrandId}/taglineGenerations/${taglineId}`
                    );
                    await updateDoc(taglineRef, { status });
                }
            } catch (error) {
                console.error(`Error updating tagline ${taglineId} status:`, error);
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: 'Could not update the tagline status.',
                });
            }
        },
        [user, selectedBrandId, toast, firestore]
    );

    const handleTaglineEdit = useCallback(
        async (taglineId: string, text: string) => {
            if (!user || !selectedBrandId) return;
            try {
                const taglineRef = doc(
                    firestore,
                    `users/${user.uid}/brands/${selectedBrandId}/taglineGenerations/${taglineId}`
                );
                await updateDoc(taglineRef, { tagline: text });
            } catch (error) {
                console.error(`Error editing tagline ${taglineId}:`, error);
                toast({
                    variant: 'destructive',
                    title: 'Save Failed',
                    description: 'Could not save your edits.',
                });
            }
        },
        [user, selectedBrandId, firestore, toast]
    );

    const visibleTaglines = useMemo(() => {
        return allTaglines?.filter((t) => t.status !== 'disliked') ?? [];
    }, [allTaglines]);

    useEffect(() => {
        if (brands && brands.length > 0 && !selectedBrandId) {
            router.push(`/taglines?brandId=${brands[0].id}`);
        }
    }, [brands, selectedBrandId, router]);

    if (isLoadingAuth || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-[72px] p-4 md:p-8">
            <ContentCard>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Taglines</h1>
                        <p className="text-muted-foreground">Generate and manage taglines for your brands.</p>
                    </div>

                    {isLoadingBrands && (
                        <div className="text-center py-8">
                            <Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground mt-2">Loading brands...</p>
                        </div>
                    )}


                    {!isLoadingBrands && (!brands || brands.length === 0) && (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <h2 className="text-xl font-semibold">No Brands Yet</h2>
                            <p className="text-muted-foreground mt-2">
                                Create a brand first to generate taglines.
                            </p>
                        </div>
                    )}

                    {selectedBrandId && (
                        <>
                            {isLoadingSelectedBrand || isLoadingTaglines ? (
                                <div className="text-center py-8">
                                    <Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground mt-2">Loading taglines...</p>
                                </div>
                            ) : (
                                <TaglinesList
                                    taglines={visibleTaglines}
                                    isLoading={isLoadingTaglines}
                                    isGenerating={isGeneratingTaglines}
                                    onGenerate={handleGenerateTaglines}
                                    onStatusUpdate={handleTaglineStatusUpdate}
                                    onEdit={handleTaglineEdit}
                                />
                            )}
                        </>
                    )}
                </div>
            </ContentCard>
        </div>
    );
}
