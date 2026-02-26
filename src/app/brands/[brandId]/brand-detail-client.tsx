'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
    collection,
    serverTimestamp,
    query,
    orderBy,
    updateDoc,
    addDoc,
    doc,
} from 'firebase/firestore';
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import {
    getLogoSuggestion,
    getLogoSuggestionOpenAI,
    getLogoSuggestionFal,
    getColorizedLogo,
    convertUrlToDataUri,
    getLogoConcept,
    getLogoCritique,
    getVectorizedLogo,
} from '@/app/actions';
import { uploadDataUriToR2Client } from '@/lib/r2-upload-client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createBrandService, createLogoService } from '@/services';
import { BrandIdentityCard } from '@/features/brands/components';
import { ContentCard } from '@/components/layout';
import { TutorialModal } from '@/features/onboarding/components';
import { BRAND_FONTS } from '@/config/brand-fonts';
import { useCredits } from '@/hooks/use-credits';
import { CREDIT_COSTS, type CreditAction } from '@/lib/credits';
import type { Brand, Logo } from '@/lib/types';
import { ErrorBoundary } from '@/components/error-boundary';

export function BrandDetailClient() {
    const { brandId } = useParams();
    const searchParams = useSearchParams();
    const isNewBrand = searchParams.get('new') === 'true';
    const [showTutorial, setShowTutorial] = useState(isNewBrand);
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
    const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
    const [isColorizing, setIsColorizing] = useState(false);
    const [isVectorizing, setIsVectorizing] = useState(false);
    const [isCritiquing, setIsCritiquing] = useState(false);
    const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
    const [logoConcept, setLogoConcept] = useState<string | null>(null);
    const processedLogoCountRef = useRef<number>(0);

    const { balance: creditBalance, creditsService } = useCredits();

    const brandService = useMemo(() => createBrandService(firestore), [firestore]);
    const logoService = useMemo(() => createLogoService(firestore), [firestore]);

    /** Check credits and deduct if sufficient. Returns false if insufficient. */
    const tryDeductCredits = useCallback(async (action: CreditAction): Promise<boolean> => {
        if (!user) return false;
        const cost = CREDIT_COSTS[action];
        if (creditBalance < cost) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Credits',
                description: `This action costs ${cost} credits. You have ${creditBalance}. Buy more credits to continue.`,
            });
            return false;
        }
        try {
            await creditsService.deductCredits(user.uid, action);
            return true;
        } catch {
            toast({
                variant: 'destructive',
                title: 'Insufficient Credits',
                description: `You need ${cost} credits for this action.`,
            });
            return false;
        }
    }, [user, creditBalance, creditsService, toast]);

    const brandRef = useMemoFirebase(
        () =>
            user
                ? brandService.getBrandDoc(user.uid, brandId as string)
                : null,
        [user, brandService, brandId]
    );
    const { data: brand, isLoading: isLoadingBrand } = useDoc<Brand>(brandRef);

    useEffect(() => {
        if (brand?.latestConcept) {
            setLogoConcept(brand.latestConcept);
        }
    }, [brand?.latestConcept]);

    const handleLogoFontChange = useCallback(async (logoId: string, font: string) => {
        if (!user || !brandId) return;
        try {
            const logoRef = doc(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations/${logoId}`);
            await updateDoc(logoRef, { font });
        } catch (error) {
            console.error('Error updating logo font:', error);
        }
    }, [user, brandId, firestore]);

    const logosQuery = useMemoFirebase(
        () =>
            user
                ? query(
                    collection(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations`),
                    orderBy('createdAt', 'asc')
                )
                : null,
        [user, firestore, brandId]
    );
    const { data: logos, isLoading: isLoadingLogos } = useCollection<Logo>(logosQuery);

    const filteredLogos = useMemo(() => {
        return logos?.filter(logo => !logo.isDeleted) || [];
    }, [logos]);

    const currentLogo = filteredLogos?.[currentLogoIndex];

    const handleGenerateConcept = useCallback(async () => {
        if (!brand) return;
        if (!(await tryDeductCredits('logoConcept'))) return;
        setIsGeneratingConcept(true);
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            const result = await getLogoConcept(
                idToken,
                brand.latestName,
                brand.latestElevatorPitch,
                brand.latestAudience,
                brand.latestDesirableCues,
                brand.latestUndesirableCues
            );
            if (result.success && result.data) {
                const combinedConcept = `${result.data.concept}\n\nStyle Prompt: ${result.data.stylePrompt}`;
                setLogoConcept(combinedConcept);
                if (brandRef) {
                    await updateDoc(brandRef, { latestConcept: combinedConcept });
                }
                toast({
                    title: 'Brand concept generated!',
                    description: 'You can edit the concept before generating the logo.',
                });
            } else {
                throw new Error(result.error || 'Failed to generate logo concept.');
            }
        } catch (error) {
            console.error('Error generating logo concept:', error);
            toast({
                variant: 'destructive',
                title: 'Concept Generation Failed',
                description: error instanceof Error ? error.message : 'Could not generate logo concept.',
            });
        } finally {
            setIsGeneratingConcept(false);
        }
    }, [brand, toast, brandRef, tryDeductCredits, auth]);

    useEffect(() => {
        if (brand && !brand.latestConcept && !logoConcept && !isGeneratingConcept) {
            console.log('Auto-generating missing brand concept...');
            handleGenerateConcept();
        }
    }, [brand, logoConcept, isGeneratingConcept, handleGenerateConcept]);

    const handleConceptChange = useCallback((concept: string) => {
        setLogoConcept(concept);
    }, []);

    const [provider, setProvider] = useState<'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana'>('nano-banana');
    const handleGenerateLogo = useCallback(async (providerOverride?: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana') => {
        const selectedProvider = providerOverride || provider;
        if (!brand || !user || !firestore || !logoConcept) return;
        if (!(await tryDeductCredits('logoGeneration'))) return;
        setIsGeneratingLogo(true);
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            let result;

            if (selectedProvider === 'gemini') {
                result = await getLogoSuggestion(
                    idToken,
                    brand.latestName,
                    brand.latestElevatorPitch,
                    brand.latestAudience,
                    brand.latestDesirableCues,
                    brand.latestUndesirableCues,
                    logoConcept
                );
            } else if (selectedProvider === 'openai') {
                result = await getLogoSuggestionOpenAI(
                    idToken,
                    brand.latestName,
                    brand.latestElevatorPitch,
                    brand.latestAudience,
                    brand.latestDesirableCues,
                    brand.latestUndesirableCues,
                    { size: '512x512', concept: logoConcept }
                );
            } else if (selectedProvider === 'ideogram' || selectedProvider === 'reve' || selectedProvider === 'nano-banana') {
                let modelId = 'fal-ai/ideogram/v3';
                if (selectedProvider === 'reve') modelId = 'fal-ai/reve/text-to-image';
                if (selectedProvider === 'nano-banana') modelId = 'fal-ai/nano-banana-pro';

                result = await getLogoSuggestionFal(
                    idToken,
                    brand.latestName,
                    brand.latestElevatorPitch,
                    brand.latestAudience,
                    brand.latestDesirableCues,
                    brand.latestUndesirableCues,
                    logoConcept,
                    modelId
                );
            } else {
                throw new Error('Invalid provider');
            }

            if (result.success && result.data) {
                console.log('Uploading logo to R2...');
                const logoUrl = await uploadDataUriToR2Client(result.data.logoUrl, user.uid, 'logos');
                console.log('Logo uploaded to R2 successfully:', logoUrl);

                const logoData = {
                    brandId,
                    userId: user.uid,
                    logoUrl: logoUrl,
                    prompt: result.data.prompt,
                    concept: logoConcept,
                    createdAt: serverTimestamp(),
                    isPublic: false,
                    font: BRAND_FONTS[Math.floor(Math.random() * BRAND_FONTS.length)].name,
                };

                const logosCollection = collection(
                    firestore,
                    `users/${user.uid}/brands/${brandId}/logoGenerations`
                );
                const logoDocRef = await addDoc(logosCollection, logoData);
                await updateDoc(logoDocRef, { id: logoDocRef.id });

                toast({
                    title: 'New logo generated!',
                    description: `Your new brand logo has been saved (${selectedProvider}).`,
                });
            } else {
                throw new Error(result.error || 'Failed to generate and save logo.');
            }
        } catch (error) {
            console.error('Error generating logo:', error);
            toast({
                variant: 'destructive',
                title: 'Logo Generation Failed',
                description: error instanceof Error ? error.message : 'Could not generate a new logo.',
            });
        } finally {
            setIsGeneratingLogo(false);
        }
    }, [brand, user, brandId, firestore, toast, logoConcept, provider, tryDeductCredits, auth]);

    const hasAutoGeneratedRef = useRef(false);
    useEffect(() => {
        if (
            brand &&
            logoConcept &&
            !isLoadingLogos &&
            logos &&
            logos.length === 0 &&
            !hasAutoGeneratedRef.current
        ) {
            console.log('Auto-generating initial logos...');
            hasAutoGeneratedRef.current = true;
            handleGenerateLogo('nano-banana');
            handleGenerateLogo('reve');
        }
    }, [brand, logoConcept, isLoadingLogos, logos, handleGenerateLogo]);

    const handleSaveDisplaySettings = useCallback(async (logoId: string, settings: Logo['displaySettings']) => {
        if (!user || !settings) return;

        try {
            const logoRef = doc(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations/${logoId}`);
            await updateDoc(logoRef, {
                displaySettings: settings
            });

            if (currentLogo && currentLogo.id === logoId && brandRef) {
                await updateDoc(brandRef, { displaySettings: settings });
            }
        } catch (error) {
            console.error('Error saving display settings:', error);
        }
    }, [user, brandId, firestore, currentLogo, brandRef]);

    const handleMakeLogoPublic = useCallback(async (logoId: string) => {
        if (!user) return;

        try {
            const logoRef = doc(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations/${logoId}`);
            const { getDoc, setDoc } = await import('firebase/firestore');
            const logoSnap = await getDoc(logoRef);

            if (!logoSnap.exists()) {
                throw new Error('Logo not found');
            }

            const logoData = logoSnap.data();
            const publicLogoRef = doc(firestore, `brands/${brandId}/logos/${logoId}`);
            await setDoc(publicLogoRef, {
                ...logoData,
                isPublic: true,
            });

            await updateDoc(logoRef, {
                isPublic: true,
            });

            const publicBrandRef = doc(firestore, `brands/${brandId}`);
            const publicBrandSnap = await getDoc(publicBrandRef);

            if (!publicBrandSnap.exists()) {
                const brandRef = doc(firestore, `users/${user.uid}/brands/${brandId}`);
                const brandSnap = await getDoc(brandRef);

                if (brandSnap.exists()) {
                    await setDoc(publicBrandRef, brandSnap.data());
                }
            }
        } catch (error) {
            console.error('Error making logo public:', error);
            throw error;
        }
    }, [user, brandId, firestore]);

    const handleDeleteColorVersion = useCallback(async (versionIndex: number) => {
        if (!user || !currentLogo) return;

        try {
            const logoRef = doc(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations/${currentLogo.id}`);
            const { getDoc } = await import('firebase/firestore');
            const logoSnap = await getDoc(logoRef);

            if (logoSnap.exists()) {
                const logoData = logoSnap.data() as Logo;
                const colorVersions = logoData.colorVersions || [];

                if (versionIndex >= 0 && versionIndex < colorVersions.length) {
                    const updatedVersions = [...colorVersions];
                    updatedVersions.splice(versionIndex, 1);

                    await updateDoc(logoRef, {
                        colorVersions: updatedVersions
                    });

                    toast({
                        title: 'Color version deleted',
                        description: 'The color version has been removed.',
                    });
                }
            }
        } catch (error) {
            console.error('Error deleting color version:', error);
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: 'Could not delete the color version.',
            });
        }
    }, [user, brandId, firestore, currentLogo, toast]);

    const generateConceptBackground = useCallback(async () => {
        if (!brand) return;
        console.log('Triggering background concept generation...');
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            const result = await getLogoConcept(
                idToken,
                brand.latestName,
                brand.latestElevatorPitch,
                brand.latestAudience,
                brand.latestDesirableCues,
                brand.latestUndesirableCues
            );
            if (result.success && result.data) {
                const combinedConcept = `${result.data.concept}\n\nStyle Prompt: ${result.data.stylePrompt}`;
                if (brandRef) {
                    await updateDoc(brandRef, { latestConcept: combinedConcept });
                    console.log('Background concept generation complete and saved.');
                }
            }
        } catch (error) {
            console.error('Background concept generation failed:', error);
        }
    }, [brand, brandRef, auth]);

    useEffect(() => {
        if (logos && logos.length > 0) {
            const latestLogoIndex = logos.length - 1;
            if (processedLogoCountRef.current === logos.length) {
                return;
            }
            if (latestLogoIndex % 2 !== 0) {
                processedLogoCountRef.current = logos.length;
                generateConceptBackground();
            }
        }
    }, [logos?.length, generateConceptBackground]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleColorizeLogo = useCallback(async () => {
        if (!currentLogo || !user || !firestore || !brand) return;
        if (!(await tryDeductCredits('logoColorization'))) return;
        setIsColorizing(true);
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            const result = await getColorizedLogo(idToken, {
                logoUrl: currentLogo.logoUrl,
                name: brand.latestName,
                elevatorPitch: brand.latestElevatorPitch,
                audience: brand.latestAudience,
                desirableCues: brand.latestDesirableCues,
                undesirableCues: brand.latestUndesirableCues,
            });

            if (result.success && result.data) {
                console.log('Uploading colorized logo to R2...');
                const colorLogoUrl = await uploadDataUriToR2Client(result.data.colorLogoUrl, user.uid, 'logos');
                console.log('Colorized logo uploaded to R2 successfully:', colorLogoUrl);

                const existingColorVersions = currentLogo.colorVersions || [];
                if (existingColorVersions.length === 0 && currentLogo.colorLogoUrl) {
                    existingColorVersions.push({
                        colorLogoUrl: currentLogo.colorLogoUrl,
                        palette: currentLogo.palette || []
                    });
                }

                const updatedColorVersions = [...existingColorVersions, {
                    colorLogoUrl: colorLogoUrl,
                    palette: result.data.palette
                }];

                const currentLogoDocRef = doc(
                    firestore,
                    `users/${user.uid}/brands/${brandId}/logoGenerations/${currentLogo.id}`
                );
                await updateDoc(currentLogoDocRef, {
                    colorVersions: updatedColorVersions,
                    colorLogoUrl: colorLogoUrl,
                    palette: result.data.palette,
                });
                toast({
                    title: 'Logo colorized!',
                    description: `Color version ${updatedColorVersions.length} has been generated.`,
                });
            } else {
                throw new Error(result.error || 'Failed to colorize logo.');
            }
        } catch (error) {
            console.error('Error colorizing logo:', error);
            toast({
                variant: 'destructive',
                title: 'Colorization Failed',
                description: error instanceof Error ? error.message : 'Could not colorize the logo.',
            });
        } finally {
            setIsColorizing(false);
        }
    }, [currentLogo, user, brand, firestore, toast, brandId, tryDeductCredits, auth]);

    const handleCritiqueLogo = useCallback(async () => {
        if (!currentLogo || !brand || !user || !firestore) return;
        if (!(await tryDeductCredits('logoCritique'))) return;
        setIsCritiquing(true);
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            const logoUrlToCritique = currentLogo.colorLogoUrl || currentLogo.logoUrl;
            const dataUriResult = await convertUrlToDataUri(idToken, logoUrlToCritique);
            if (!dataUriResult.success || !dataUriResult.data) {
                throw new Error(dataUriResult.error || 'Failed to prepare image for critique.');
            }

            const result = await getLogoCritique(idToken, {
                logoUrl: dataUriResult.data,
                brandName: brand.latestName,
                elevatorPitch: brand.latestElevatorPitch,
                audience: brand.latestAudience,
                desirableCues: brand.latestDesirableCues,
                undesirableCues: brand.latestUndesirableCues,
            });

            if (result.success && result.data) {
                const currentLogoDocRef = doc(
                    firestore,
                    `users/${user.uid}/brands/${brandId}/logoGenerations/${currentLogo.id}`
                );
                await updateDoc(currentLogoDocRef, {
                    critique: result.data,
                });
                toast({
                    title: 'Critique generated!',
                    description: 'The AI has analyzed your logo.',
                });
            } else {
                throw new Error(result.error || 'Failed to critique logo.');
            }
        } catch (error) {
            console.error('Error critiquing logo:', error);
            toast({
                variant: 'destructive',
                title: 'Critique Failed',
                description: error instanceof Error ? error.message : 'Could not critique the logo.',
            });
        } finally {
            setIsCritiquing(false);
        }
    }, [currentLogo, brand, user, firestore, brandId, toast, tryDeductCredits, auth]);

    const handleVectorizeLogo = useCallback(async (croppedLogoUrl: string) => {
        if (!currentLogo || !user || !firestore) return;
        if (!(await tryDeductCredits('logoVectorization'))) return;
        setIsVectorizing(true);
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            console.log('Uploading cropped logo to R2...');
            const uploadedCroppedUrl = await uploadDataUriToR2Client(croppedLogoUrl, user.uid, 'logos');

            const result = await getVectorizedLogo(idToken, uploadedCroppedUrl);

            if (result.success && result.data) {
                console.log('Uploading vector logo to R2...');
                const vectorLogoStorageUrl = await uploadDataUriToR2Client(result.data.vectorLogoUrl, user.uid, 'logos');

                const currentLogoDocRef = doc(
                    firestore,
                    `users/${user.uid}/brands/${brandId}/logoGenerations/${currentLogo.id}`
                );
                await updateDoc(currentLogoDocRef, {
                    vectorLogoUrl: vectorLogoStorageUrl,
                });

                toast({
                    title: 'Vectorization complete!',
                    description: 'SVG version has been generated and saved.',
                });
            } else {
                throw new Error(result.error || 'Failed to vectorize logo.');
            }
        } catch (error) {
            console.error('Error vectorizing logo:', error);
            toast({
                variant: 'destructive',
                title: 'Vectorization Failed',
                description: error instanceof Error ? error.message : 'Could not vectorize the logo.',
            });
        } finally {
            setIsVectorizing(false);
        }
    }, [currentLogo, user, firestore, brandId, toast, tryDeductCredits, auth]);

    const primaryTagline = brand?.primaryTagline || 'Your tagline will appear here.';

    useEffect(() => {
        if (logos && logos.length > 0) {
            setCurrentLogoIndex(logos.length - 1);
        }
    }, [logos?.length]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (logos && logos.length > 0 && brandRef && currentLogo) {
            const logoToDisplay = currentLogo.colorLogoUrl || currentLogo.logoUrl;
            const settingsToDisplay = currentLogo.displaySettings;

            const updates: Record<string, unknown> = {};
            if (logoToDisplay !== brand?.logoUrl) {
                updates.logoUrl = logoToDisplay;
            }
            if (settingsToDisplay && JSON.stringify(settingsToDisplay) !== JSON.stringify(brand?.displaySettings)) {
                updates.displaySettings = settingsToDisplay;
            }
            if (Object.keys(updates).length > 0) {
                updateDoc(brandRef, updates);
            }
        }
    }, [logos, currentLogoIndex, brandRef, brand?.logoUrl, brand?.displaySettings, currentLogo]);

    const handleSaveExternalMedia = useCallback(async (logoId: string, url: string) => {
        if (!user || !brandId || !firestore) return;
        try {
            const logoRef = doc(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations/${logoId}`);
            await updateDoc(logoRef, {
                externalMediaUrl: url
            });
            toast({
                title: 'Media Saved',
                description: 'External media link has been updated.',
            });
        } catch (error) {
            console.error('Error saving external media:', error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save external media link.',
            });
        }
    }, [user, brandId, firestore, toast]);

    const handleBrandNameChange = useCallback(async (name: string, elevatorPitch: string) => {
        if (!user || !brandId || !brandRef) return;
        try {
            await updateDoc(brandRef, {
                latestName: name,
                latestElevatorPitch: elevatorPitch,
            });
        } catch (error) {
            console.error('Error updating brand:', error);
            throw error;
        }
    }, [user, brandId, brandRef]);

    const handleDeleteLogo = useCallback(async () => {
        if (!currentLogo || !user || !brandId) return;
        try {
            await logoService.deleteLogo(user.uid, brandId as string, currentLogo.id);
            if (currentLogoIndex >= filteredLogos.length - 1) {
                setCurrentLogoIndex(Math.max(0, filteredLogos.length - 2));
            }
            toast({
                title: 'Logo deleted',
                description: 'The logo has been removed.',
            });
        } catch (error) {
            console.error('Error deleting logo:', error);
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: 'Could not delete the logo.',
            });
        }
    }, [currentLogo, user, brandId, logoService, currentLogoIndex, filteredLogos.length, toast]);

    const handleSaveCropDetails = useCallback(async (logoId: string, cropDetails: { x: number; y: number; width: number; height: number }) => {
        if (!user || !brandId) return;
        try {
            await logoService.updateLogoCropDetails(user.uid, brandId as string, logoId, cropDetails);
        } catch (error) {
            console.error('Error saving crop details:', error);
        }
    }, [user, brandId, logoService]);

    const isLoading = isLoadingBrand || isUserLoading;

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-[1280px]">
                <ContentCard>
                    {isLoading && (
                        <div className="text-center">
                            <Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground mt-2">Loading brand details...</p>
                        </div>
                    )}

                    {!isLoading && !brand && (
                        <div className="text-center p-8">
                            <h2 className="text-xl font-bold">Brand Not Found</h2>
                            <p className="text-muted-foreground mt-2">
                                We couldn&apos;t find the brand you&apos;re looking for.
                            </p>
                        </div>
                    )}

                    {brand && (
                        <div className="space-y-8">
                            <ErrorBoundary section="Brand Editor">
                            <BrandIdentityCard
                                brandId={brandId as string}
                                brandName={brand.latestName}
                                primaryTagline={primaryTagline}
                                logos={filteredLogos}
                                currentLogoIndex={currentLogoIndex}
                                isLoadingLogos={isLoadingLogos}
                                isGeneratingLogo={isGeneratingLogo}
                                isGeneratingConcept={isGeneratingConcept}
                                isColorizing={isColorizing}
                                isLoadingTaglines={false}
                                logoConcept={logoConcept}
                                onGenerateConcept={handleGenerateConcept}
                                onConceptChange={handleConceptChange}
                                onGenerateLogo={handleGenerateLogo}
                                onColorizeLogo={handleColorizeLogo}
                                onLogoIndexChange={setCurrentLogoIndex}
                                onCritiqueLogo={handleCritiqueLogo}
                                isCritiquing={isCritiquing}
                                onLogoFontChange={handleLogoFontChange}
                                onSaveDisplaySettings={handleSaveDisplaySettings}
                                onMakeLogoPublic={handleMakeLogoPublic}
                                selectedProvider={provider}
                                setSelectedProvider={setProvider}
                                onSaveExternalMedia={handleSaveExternalMedia}
                                onDeleteColorVersion={handleDeleteColorVersion}
                                onVectorizeLogo={handleVectorizeLogo}
                                isVectorizing={isVectorizing}
                                onBrandNameChange={handleBrandNameChange}
                                onDeleteLogo={handleDeleteLogo}
                                onSaveCropDetails={handleSaveCropDetails}
                            />
                            </ErrorBoundary>

                            <TutorialModal
                                isOpen={showTutorial}
                                onClose={() => setShowTutorial(false)}
                            />
                        </div>
                    )}
                </ContentCard>
            </div>
        </div>
    );
}
