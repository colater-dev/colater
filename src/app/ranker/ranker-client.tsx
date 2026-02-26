'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collectionGroup, where, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { createLogoService } from '@/services';
import type { Logo } from '@/lib/types';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export function RankerClient() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const logoService = useMemo(() => createLogoService(firestore), [firestore]);

    const logosQuery = useMemoFirebase(
        () => user ? query(
            collectionGroup(firestore, 'logoGenerations'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        ) : null,
        [user, firestore]
    );

    const { data: allLogos, isLoading: isLoadingLogos } = useCollection<Logo>(logosQuery);

    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (allLogos) {
            const initialFeedback: Record<string, string> = {};
            allLogos.forEach(logo => {
                if (logo.feedback) initialFeedback[logo.id] = logo.feedback;
            });
            setFeedbackValues(initialFeedback);
        }
    }, [allLogos]);

    const handleRate = async (logo: Logo, rating: number) => {
        if (!user) return;
        setUpdatingIds(prev => new Set(prev).add(logo.id));
        try {
            await logoService.updateLogoRating(user.uid, logo.brandId, logo.id, rating, feedbackValues[logo.id]);
            toast({
                title: 'Rating saved!',
                description: `Logo rated ${rating} stars.`,
            });
        } catch (error) {
            console.error('Error saving rating:', error);
            toast({
                variant: 'destructive',
                title: 'Save failed',
                description: 'Could not save rating.',
            });
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(logo.id);
                return next;
            });
        }
    };

    const handleFeedbackBlur = async (logo: Logo) => {
        if (!user || logo.feedback === feedbackValues[logo.id]) return;
        setUpdatingIds(prev => new Set(prev).add(logo.id));
        try {
            await logoService.updateLogoRating(user.uid, logo.brandId, logo.id, logo.rating || 0, feedbackValues[logo.id]);
        } catch (error) {
            console.error('Error saving feedback:', error);
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(logo.id);
                return next;
            });
        }
    };

    if (isUserLoading || isLoadingLogos) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please log in to use the Ranker</h1>
                    <Button onClick={() => window.location.href = '/'}>Go Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Logo Ranker</h1>
                        <p className="text-gray-500 mt-2">Rate your logo generations to help improve the master prompt.</p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {allLogos?.map(logo => (
                        <Card key={logo.id} className="overflow-hidden border-none shadow-[0px_1px_2px_rgba(0,0,0,0.06),0px_0px_0px_1px_rgba(0,0,0,0.02)]">
                            <CardContent className="p-0">
                                <div className="grid md:grid-cols-[300px_1fr] min-h-[300px]">
                                    {/* Logo Previews */}
                                    <div className="bg-white p-6 border-r border-gray-100 flex flex-col items-center justify-center gap-4">
                                        <div className="relative w-48 h-48 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                            <Image
                                                src={logo.logoUrl}
                                                alt="B&W Logo"
                                                fill
                                                className="object-contain p-4"
                                            />
                                        </div>
                                        {logo.colorVersions && logo.colorVersions.length > 0 && (
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {logo.colorVersions.map((v, i) => (
                                                    <div key={i} className="relative w-16 h-16 bg-gray-50 rounded border border-gray-100 overflow-hidden">
                                                        <Image
                                                            src={v.colorLogoUrl}
                                                            alt={`Color version ${i + 1}`}
                                                            fill
                                                            className="object-contain p-1"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info & Rating */}
                                    <div className="p-8 flex flex-col gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Prompt</h3>
                                            <p className="text-gray-700 italic border-l-2 border-primary/20 pl-4 py-2 bg-gray-50/50 rounded-r">
                                                {logo.prompt || "No prompt available"}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Rating</h3>
                                                {updatingIds.has(logo.id) && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => handleRate(logo, star)}
                                                        className={`p-1 transition-colors ${(logo.rating || 0) >= star
                                                                ? 'text-yellow-400 hover:text-yellow-500'
                                                                : 'text-gray-200 hover:text-gray-300'
                                                            }`}
                                                    >
                                                        <Star className="w-8 h-8 fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-1">
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Qualitative Feedback</h3>
                                            <Textarea
                                                placeholder="What did the AI get right or wrong? How can the prompt be improved?"
                                                value={feedbackValues[logo.id] || ''}
                                                onChange={(e) => setFeedbackValues(prev => ({ ...prev, [logo.id]: e.target.value }))}
                                                onBlur={() => handleFeedbackBlur(logo)}
                                                className="min-h-[100px] resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {allLogos && allLogos.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-400">No logos generated yet.</p>
                            <Button className="mt-4" onClick={() => window.location.href = '/brands/new'}>
                                Generate your first logo
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
