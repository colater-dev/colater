'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { createPresentationService } from '@/services';
import type { Brand, Logo, Presentation } from '@/lib/types';

type CoverContent = { brandName: string; tagline: string; clientName?: string; backgroundColor?: string };
type ChallengeContent = { challengeTitle: string; problemStatement: string; marketContext: string };
type SolutionContent = { solutionStatement: string; keyAttributes: string[]; targetAudienceStatement: string };
type ColorStoryContent = { colorPhilosophy: string; colorUsage: Array<{ color: string; name: string; usage: string }> };
type NextStepsContent = { deliverablesList: string[]; nextStepsStatement: string; closingMessage: string };
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Loader2, ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Slides from '@/features/presentation/components/slides';
import { generatePresentationPDF, ExportProgress } from '@/features/presentation/utils/pdf-generator';
import { useToast } from '@/hooks/use-toast';

interface PublicPresentationClientProps {
    shareToken: string;
}

export default function PublicPresentationClient({ shareToken }: PublicPresentationClientProps) {
    const firestore = useFirestore();
    const presentationService = useMemo(() => createPresentationService(firestore), [firestore]);

    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
    const { toast } = useToast();

    // Initial load of presentation via token
    useEffect(() => {
        const load = async () => {
            try {
                const data = await presentationService.getPresentationByShareToken(shareToken);
                if (data) {
                    setPresentation(data);
                } else {
                    setError("Presentation not found or no longer public.");
                }
            } catch {
                setError("Failed to load presentation.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [shareToken, presentationService]);

    const handleExportPDF = async () => {
        if (!brand) return;
        setIsExporting(true);
        try {
            await generatePresentationPDF(
                'public-pdf-export-container',
                `${brand.latestName}-Presentation.pdf`,
                (progress) => setExportProgress(progress)
            );
            toast({ title: "Export Complete", description: "Your PDF has been downloaded." });
        } catch (error) {
            console.error(error);
            toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
        } finally {
            setIsExporting(false);
            setExportProgress(null);
        }
    };

    // Fetch Brand and Logos once we have IDs
    const brandDocRef = useMemoFirebase(
        () =>
            presentation ? doc(firestore, `users/${presentation.userId}/brands/${presentation.brandId}`) : null,
        [firestore, presentation]
    );
    const logosColRef = useMemoFirebase(
        () =>
            presentation ? collection(firestore, `users/${presentation.userId}/brands/${presentation.brandId}/logoGenerations`) : null,
        [firestore, presentation]
    );

    const { data: brand, isLoading: brandLoading } = useDoc<Brand>(brandDocRef);
    const { data: logos, isLoading: logosLoading } = useCollection<Logo>(logosColRef);

    const activeLogo = useMemo(() => logos?.find(l => l.logoUrl === brand?.logoUrl) || logos?.[0], [logos, brand]);
    const activePalette = useMemo(() => activeLogo?.colorVersions?.[0]?.palette || activeLogo?.palette || ['#000000', '#FFFFFF', '#6366F1'], [activeLogo]);

    if (loading || brandLoading || logosLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-mono text-muted-foreground animate-pulse">Loading Brand Presentation...</p>
            </div>
        );
    }

    if (error || !presentation || !brand || !activeLogo) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center">
                <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                <p className="text-muted-foreground mb-6">{error || "Something went wrong while loading this presentation."}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            </div>
        );
    }

    const currentSlide = presentation.slides[currentSlideIndex];

    const renderSlide = () => {
        const baseProps = {
            brand,
            logo: activeLogo,
            palette: activePalette,
            isEditing: false,
            onUpdate: () => { }, // No updates in public view
        };

        const content = currentSlide.content;

        switch (currentSlide.slideId) {
            case 'cover': return <Slides.CoverSlide {...baseProps} content={content as unknown as CoverContent} />;
            case 'challenge': return <Slides.ChallengeSlide {...baseProps} content={content as unknown as ChallengeContent} />;
            case 'solution': return <Slides.SolutionSlide {...baseProps} content={content as unknown as SolutionContent} />;
            case 'logo-reveal': return <Slides.LogoRevealSlide {...baseProps} />;
            case 'visual-identity': return <Slides.VisualIdentitySlide {...baseProps} />;
            case 'color-story': return <Slides.ColorStorySlide {...baseProps} content={content as unknown as ColorStoryContent} />;
            case 'applications': return <Slides.ApplicationsSlide {...baseProps} />;
            case 'next-steps': return <Slides.NextStepsSlide {...baseProps} content={content as unknown as NextStepsContent} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-[#F9FAFB] overflow-hidden flex flex-col z-50">
            {/* Minimal Public Header */}
            <div className="h-14 border-b flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary text-xs">{brand.latestName[0]}</span>
                    </div>
                    <span className="font-semibold tracking-tight text-sm">{brand.latestName}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-xs"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                    >
                        {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {isExporting ? `Exporting (${exportProgress?.current}/${exportProgress?.total})` : "PDF"}
                    </Button>
                </div>
            </div>

            {/* Slide Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-auto">
                <div className="w-full max-w-6xl aspect-[16/10] bg-white shadow-xl rounded-xl md:rounded-2xl overflow-hidden relative group shrink-0 border border-black/5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide.slideId + currentSlideIndex}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full"
                        >
                            {renderSlide()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Overlays */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-16 md:w-32 flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        onClick={() => currentSlideIndex > 0 && setCurrentSlideIndex(currentSlideIndex - 1)}
                    >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-sm border border-black/5 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div
                        className="absolute right-0 top-0 bottom-0 w-16 md:w-32 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        onClick={() => currentSlideIndex < presentation.slides.length - 1 && setCurrentSlideIndex(currentSlideIndex + 1)}
                    >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-sm border border-black/5 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="h-16 border-t bg-white flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-1">
                    {presentation.slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "h-1 rounded-full transition-all",
                                currentSlideIndex === idx ? "w-6 bg-primary" : "w-2 bg-gray-200"
                            )}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>{currentSlideIndex + 1} / {presentation.slides.length}</span>
                    <span className="hidden md:inline">• Use Arrow Keys</span>
                </div>
            </div>

            {/* Hidden Export Container */}
            <div id="public-pdf-export-container" className="fixed right-[-5000px] top-0 w-[1200px] pointer-events-none bg-white">
                {presentation.slides.map((slide) => {
                    const baseProps = {
                        brand,
                        logo: activeLogo,
                        palette: activePalette,
                        isEditing: false,
                        onUpdate: () => { },
                    };
                    const content = slide.content;

                    return (
                        <div key={slide.slideId} data-slide={slide.slideId} className="w-[1200px] aspect-[16/10] bg-white overflow-hidden">
                            {slide.slideId === 'cover' && <Slides.CoverSlide {...baseProps} content={content as unknown as CoverContent} />}
                            {slide.slideId === 'challenge' && <Slides.ChallengeSlide {...baseProps} content={content as unknown as ChallengeContent} />}
                            {slide.slideId === 'solution' && <Slides.SolutionSlide {...baseProps} content={content as unknown as SolutionContent} />}
                            {slide.slideId === 'logo-reveal' && <Slides.LogoRevealSlide {...baseProps} />}
                            {slide.slideId === 'visual-identity' && <Slides.VisualIdentitySlide {...baseProps} />}
                            {slide.slideId === 'color-story' && <Slides.ColorStorySlide {...baseProps} content={content as unknown as ColorStoryContent} />}
                            {slide.slideId === 'applications' && <Slides.ApplicationsSlide {...baseProps} />}
                            {slide.slideId === 'next-steps' && <Slides.NextStepsSlide {...baseProps} content={content as unknown as NextStepsContent} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
