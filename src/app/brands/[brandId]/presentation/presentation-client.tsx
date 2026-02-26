'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { createBrandService, createLogoService, createPresentationService } from '@/services';
import type { Brand, Logo, Presentation } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    X, Loader2, Smartphone, Send, Maximize2, Type,
    Share2, Edit3, Eye, MoreHorizontal, ChevronLeft, ChevronRight, Save, Link as LinkIcon, Check,
    Download
} from 'lucide-react';
import { useSidebar } from '@/components/layout/sidebar-context';
import { getPresentationNarrative } from '@/app/actions';
import { cn } from '@/lib/utils';
import * as Slides from '@/features/presentation/components/slides';
import { useToast } from '@/hooks/use-toast';
import { generatePresentationPDF, ExportProgress } from '@/features/presentation/utils/pdf-generator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorBoundary } from '@/components/error-boundary';
import { useCredits } from '@/hooks/use-credits';
import { CREDIT_COSTS } from '@/lib/credits';

export default function PresentationClient() {
    const { brandId } = useParams() as { brandId: string };
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { toggleOpen } = useSidebar();

    const { balance: creditBalance, creditsService } = useCredits();

    const brandService = useMemo(() => createBrandService(firestore), [firestore]);
    const logoService = useMemo(() => createLogoService(firestore), [firestore]);
    const presentationService = useMemo(() => createPresentationService(firestore), [firestore]);

    const brandDocRef = useMemoFirebase(
        () =>
            user && brandId ? doc(firestore, `users/${user.uid}/brands/${brandId}`) : null,
        [firestore, user, brandId]
    );
    const logosColRef = useMemoFirebase(
        () =>
            user && brandId ? collection(firestore, `users/${user.uid}/brands/${brandId}/logoGenerations`) : null,
        [firestore, user, brandId]
    );

    const { data: brand, isLoading: brandLoading } = useDoc<Brand>(brandDocRef);
    const { data: logos, isLoading: logosLoading } = useCollection<Logo>(logosColRef);

    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

    const activeLogo = useMemo(() => logos?.find(l => l.logoUrl === brand?.logoUrl) || logos?.[0], [logos, brand]);
    const activePalette = useMemo(() => activeLogo?.colorVersions?.[0]?.palette || activeLogo?.palette || ['#000000', '#FFFFFF', '#6366F1'], [activeLogo]);

    const generatingRef = useRef(false);

    // Fetch or Initialize Presentation (auto-generates narrative if none exists)
    useEffect(() => {
        if (!user || !brandId || presentation || generatingRef.current) return;

        const loadPresentation = async () => {
            try {
                const existing = await presentationService.getLatestPresentation(user.uid, brandId);
                if (existing) {
                    setPresentation(existing);
                } else if (brand && activeLogo) {
                    // Check credits before generating narrative
                    const cost = CREDIT_COSTS.presentationNarrative;
                    if (creditBalance < cost) {
                        toast({
                            variant: 'destructive',
                            title: 'Insufficient Credits',
                            description: `Generating a presentation costs ${cost} credits. You have ${creditBalance}.`,
                        });
                        return;
                    }
                    await creditsService.deductCredits(user.uid, 'presentationNarrative');

                    generatingRef.current = true;
                    setIsGenerating(true);

                    // Generate narrative content via AI
                    const idToken = await auth.currentUser?.getIdToken() ?? '';
                    const narrativeResult = await getPresentationNarrative(idToken, {
                        brandName: brand.latestName,
                        elevatorPitch: brand.latestElevatorPitch,
                        targetAudience: brand.latestAudience,
                        desirableCues: brand.latestDesirableCues,
                        logoConceptSummary: activeLogo.concept,
                        palette: activePalette,
                        colorNames: activeLogo.colorVersions?.[0]?.colorNames || activeLogo.colorNames
                    });

                    const narrative = narrativeResult.success ? narrativeResult.data : null;

                    const initialPresentation: Partial<Presentation> = {
                        brandId,
                        userId: user.uid,
                        version: 1,
                        isPublic: false,
                        viewCount: 0,
                        slides: [
                            { slideId: 'cover', order: 0, isVisible: true, content: { brandName: brand.latestName, tagline: brand.primaryTagline || '', clientName: '' } },
                            { slideId: 'challenge', order: 1, isVisible: true, content: { challengeTitle: narrative?.challengeTitle || 'The Challenge', problemStatement: narrative?.problemStatement || brand.latestElevatorPitch, marketContext: narrative?.marketContext || '' } },
                            { slideId: 'solution', order: 2, isVisible: true, content: { solutionStatement: narrative?.solutionStatement || '', keyAttributes: narrative?.keyAttributes || [], targetAudienceStatement: narrative?.targetAudienceStatement || brand.latestAudience } },
                            { slideId: 'logo-reveal', order: 3, isVisible: true, content: {} },
                            { slideId: 'visual-identity', order: 4, isVisible: true, content: {} },
                            { slideId: 'color-story', order: 5, isVisible: true, content: { colorPhilosophy: narrative?.colorPhilosophy || '', colorUsage: narrative?.colorUsage || [] } },
                            { slideId: 'applications', order: 6, isVisible: true, content: {} },
                            { slideId: 'next-steps', order: 7, isVisible: true, content: { deliverablesList: narrative?.deliverablesList || ['Vector Logo Files', 'Brand Style Guide', 'Social Media Assets'], nextStepsStatement: narrative?.nextStepsStatement || '', closingMessage: narrative?.closingMessage || 'Building the future together.' } },
                        ]
                    };

                    // Save to Firebase and set state
                    const id = await presentationService.savePresentation(user.uid, brandId, initialPresentation);
                    setPresentation({ ...initialPresentation, id } as Presentation);
                    setIsGenerating(false);
                }
            } catch (error) {
                console.error("Failed to load presentation:", error);
                setIsGenerating(false);
                generatingRef.current = false;
                toast({
                    title: "Connection Error",
                    description: "Failed to load presentation data. Please check your connection and try again.",
                    variant: "destructive"
                });
            }
        };

        loadPresentation();
    }, [user, brandId, presentationService, brand, activeLogo, activePalette, toast, creditBalance, creditsService, auth]);

    // Keyboard Navigation
    useEffect(() => {
        if (isEditing) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                setCurrentSlideIndex(prev =>
                    prev < (presentation?.slides.length || 0) - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentSlideIndex(prev => prev > 0 ? prev - 1 : prev);
            } else if (e.key === 'Home') {
                e.preventDefault();
                setCurrentSlideIndex(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                setCurrentSlideIndex((presentation?.slides.length || 1) - 1);
            } else if (e.key === 'Escape') {
                router.back();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, presentation, router]);

    const handleUpdateSlideContent = (slideId: string, updates: any) => {
        if (!presentation) return;
        const newSlides = presentation.slides.map(s =>
            s.slideId === slideId ? { ...s, content: { ...s.content, ...updates } } : s
        );
        setPresentation({ ...presentation, slides: newSlides });
    };

    const handleSave = async () => {
        if (!user || !brandId || !presentation) return;
        setIsSaving(true);
        try {
            const id = await presentationService.savePresentation(user.uid, brandId, presentation);
            setPresentation({ ...presentation, id });
            toast({ title: "Saved", description: "Presentation updated successfully." });
        } catch (error) {
            toast({ title: "Save Failed", description: "Please try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (!user || !brandId || !presentation) return;
        setIsSharing(true);
        try {
            // First save if needed
            const id = presentation.id || await presentationService.savePresentation(user.uid, brandId, presentation);
            if (!presentation.id) setPresentation({ ...presentation, id });

            const token = presentation.shareToken || await presentationService.makePublic(user.uid, brandId, id);
            const url = `${window.location.origin}/p/${token}`;
            setShareUrl(url);
        } catch (error) {
            toast({ title: "Sharing Failed", description: "Could not generate share link.", variant: "destructive" });
        } finally {
            setIsSharing(false);
        }
    };

    const copyToClipboard = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({ title: "Copied", description: "Link copied to clipboard." });
        }
    };

    const handleExportPDF = async () => {
        if (!brand) return;

        setIsExporting(true);
        try {
            await generatePresentationPDF(
                'pdf-export-container',
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

    if (brandLoading || !presentation || !brand) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    {isGenerating && (
                        <p className="text-sm text-muted-foreground animate-pulse">Generating your presentation...</p>
                    )}
                </div>
            </div>
        );
    }

    const currentSlide = presentation.slides[currentSlideIndex];

    const renderSlide = () => {
        if (!activeLogo || !brand) return null;

        const baseProps = {
            brand,
            logo: activeLogo,
            palette: activePalette,
            isEditing,
            onUpdate: (updates: any) => handleUpdateSlideContent(currentSlide.slideId, updates),
        };

        const content = currentSlide.content;

        switch (currentSlide.slideId) {
            case 'cover': return <Slides.CoverSlide {...baseProps} content={content as any} palette={activePalette} />;
            case 'challenge': return <Slides.ChallengeSlide {...baseProps} content={content as any} />;
            case 'solution': return <Slides.SolutionSlide {...baseProps} content={content as any} />;
            case 'logo-reveal': return <Slides.LogoRevealSlide {...baseProps} palette={activePalette} />;
            case 'visual-identity': return <Slides.VisualIdentitySlide {...baseProps} />;
            case 'color-story': return <Slides.ColorStorySlide {...baseProps} content={content as any} />;
            case 'applications': return <Slides.ApplicationsSlide {...baseProps} />;
            case 'next-steps': return <Slides.NextStepsSlide {...baseProps} content={content as any} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-background overflow-hidden flex flex-col z-50 shadow-2xl">
            {/* Header / Controls */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <span className="font-bold tracking-tight">{brand?.latestName}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={isEditing ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="gap-2"
                    >
                        {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditing ? "Preview" : "Edit Mode"}
                    </Button>

                    <div className="h-6 w-px bg-border mx-2" />

                    <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="gap-2"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isExporting ? `Exporting (${exportProgress?.current}/${exportProgress?.total})` : "Export"}
                    </Button>

                    <Dialog onOpenChange={(open) => open && handleShare()}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Share Presentation</DialogTitle>
                                <DialogDescription>
                                    Anyone with this link can view this presentation.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="relative flex-1">
                                    <Input
                                        readOnly
                                        value={shareUrl || "Generating link..."}
                                        className="pr-10 bg-muted/50"
                                    />
                                    <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                                <Button
                                    size="sm"
                                    className="shrink-0 gap-2"
                                    onClick={copyToClipboard}
                                    disabled={!shareUrl}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : "Copy Link"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Slide Area */}
            <div className="flex-1 relative flex items-center justify-center bg-gray-100/50 p-0 md:p-12 overflow-auto">
                <div className="w-full max-w-6xl aspect-[16/10] bg-white shadow-2xl rounded-none md:rounded-2xl overflow-hidden relative group shrink-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide.slideId + currentSlideIndex}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full"
                        >
                            <ErrorBoundary section={`Slide: ${currentSlide.slideId}`}>
                                {renderSlide()}
                            </ErrorBoundary>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Overlays */}
                    {!isEditing && (
                        <>
                            <div
                                className="absolute left-0 top-0 bottom-0 w-32 flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                onClick={() => currentSlideIndex > 0 && setCurrentSlideIndex(currentSlideIndex - 1)}
                            >
                                <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm border border-black/5 flex items-center justify-center hover:bg-white transition-colors">
                                    <ChevronLeft className="w-6 h-6" />
                                </div>
                            </div>
                            <div
                                className="absolute right-0 top-0 bottom-0 w-32 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                onClick={() => currentSlideIndex < presentation.slides.length - 1 && setCurrentSlideIndex(currentSlideIndex + 1)}
                            >
                                <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm border border-black/5 flex items-center justify-center hover:bg-white transition-colors">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Pagination / Slide Sorter */}
            <div className="h-24 border-t bg-white flex items-center justify-center gap-2 px-6 overflow-x-auto shrink-0">
                {presentation.slides.map((slide, idx) => (
                    <button
                        key={slide.slideId}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={cn(
                            "group relative w-20 aspect-[16/10] rounded-lg border-2 transition-all overflow-hidden shrink-0",
                            currentSlideIndex === idx ? "border-primary ring-2 ring-primary/20 scale-110" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                    >
                        <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center">
                            <span className="font-mono text-[10px] uppercase tracking-tighter opacity-30 group-hover:opacity-100">Slide {idx + 1}</span>
                            <span className="font-bold text-[8px] uppercase tracking-widest leading-none mt-1">{slide.slideId.replace('-', ' ')}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Hidden Export Container */}
            <div id="pdf-export-container" className="fixed right-[-5000px] top-0 w-[1200px] pointer-events-none bg-white">
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
                            <ErrorBoundary section={`Export: ${slide.slideId}`}>
                                {slide.slideId === 'cover' && <Slides.CoverSlide {...baseProps} content={content as any} palette={activePalette} />}
                                {slide.slideId === 'challenge' && <Slides.ChallengeSlide {...baseProps} content={content as any} />}
                                {slide.slideId === 'solution' && <Slides.SolutionSlide {...baseProps} content={content as any} />}
                                {slide.slideId === 'logo-reveal' && <Slides.LogoRevealSlide {...baseProps} palette={activePalette} />}
                                {slide.slideId === 'visual-identity' && <Slides.VisualIdentitySlide {...baseProps} />}
                                {slide.slideId === 'color-story' && <Slides.ColorStorySlide {...baseProps} content={content as any} />}
                                {slide.slideId === 'applications' && <Slides.ApplicationsSlide {...baseProps} />}
                                {slide.slideId === 'next-steps' && <Slides.NextStepsSlide {...baseProps} content={content as any} />}
                            </ErrorBoundary>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
