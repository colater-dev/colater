'use client';

import { useOnboardingState } from '@/features/onboarding/hooks/use-onboarding-state';
import { useStepNavigation } from '@/features/onboarding/hooks/use-step-navigation';
import { OnboardingStepWrapper } from '@/features/onboarding/components';
import { useFirestore } from '@/firebase';
import { useRequireAuth } from '@/features/auth/hooks';
import { createBrandService } from '@/services';
import { useMemo, useState } from 'react';
import { Edit2, CheckCircle2 } from 'lucide-react';
import { trackOnboardingEvent } from '@/features/onboarding/utils/onboarding-analytics';
import { useToast } from '@/hooks/use-toast';

export default function ReviewStepClient() {
    const { state } = useOnboardingState();
    const { back, goTo } = useStepNavigation('review');
    const { user } = useRequireAuth();
    const firestore = useFirestore();
    const brandService = useMemo(() => createBrandService(firestore), [firestore]);
    const { toast } = useToast();
    const [, setIsSubmitting] = useState(false);

    const handleGenerate = async () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Authentication Required',
                description: 'Please sign in to save your brand.',
            });
            return false;
        }

        setIsSubmitting(true);
        try {
            const brandId = await brandService.createBrand(user.uid, {
                latestName: state.brandName,
                latestElevatorPitch: state.elevatorPitch,
                latestAudience: state.targetAudience,
                latestDesirableCues: state.desirableStyles.join(', '),
                latestUndesirableCues: state.undesirableStyles.join(', '),
            });

            trackOnboardingEvent('onboarding_completed', { brandId });

            // We don't clear state yet, we might need it for the generating page or if they go back
            // But we navigate to generating page with the brandId
            window.location.href = `/onboarding/generating?brandId=${brandId}`;
            return true;
        } catch (error) {
            console.error('Error creating brand:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to create your brand. Please try again.',
            });
            setIsSubmitting(false);
            return false;
        }
    };

    return (
        <OnboardingStepWrapper
            currentStep={5}
            totalSteps={5}
            title="Ready to bring your brand to life?"
            description="Review your details below before we start generating assets."
            onNext={handleGenerate}
            onBack={back}
            nextLabel="Generate My Brand"
        >
            <div className="space-y-6">
                <div className="grid gap-4">
                    <ReviewItem
                        label="Brand Name"
                        value={state.brandName}
                        onEdit={() => goTo('name')}
                    />
                    <ReviewItem
                        label="Elevator Pitch"
                        value={state.elevatorPitch}
                        onEdit={() => goTo('pitch')}
                    />
                    <ReviewItem
                        label="Target Audience"
                        value={state.targetAudience}
                        onEdit={() => goTo('audience')}
                    />
                    <ReviewItem
                        label="Visual Style"
                        value={state.desirableStyles.join(', ')}
                        onEdit={() => goTo('style')}
                    />
                </div>

                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <p className="text-sm font-medium text-primary/80">
                        You&apos;re all set! We&apos;ll generate a logo, palette, and guidelines.
                    </p>
                </div>
            </div>
        </OnboardingStepWrapper>
    );
}

function ReviewItem({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
    return (
        <div className="group relative p-4 rounded-xl border-2 border-primary/5 hover:border-primary/20 transition-all bg-muted/30">
            <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                <button
                    onClick={onEdit}
                    className="p-1 hover:bg-primary/10 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4 text-primary" />
                </button>
            </div>
            <p className="text-foreground font-semibold leading-relaxed line-clamp-2">{value || 'Not set'}</p>
        </div>
    );
}
