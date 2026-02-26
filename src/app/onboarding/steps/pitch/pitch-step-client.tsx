'use client';

import { useOnboardingState } from '@/features/onboarding/hooks/use-onboarding-state';
import { useStepNavigation } from '@/features/onboarding/hooks/use-step-navigation';
import { OnboardingStepWrapper } from '@/features/onboarding/components';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { pitchStepSchema } from '@/features/onboarding/utils/validation-schemas';
import { trackOnboardingEvent } from '@/features/onboarding/utils/onboarding-analytics';
import { useState } from 'react';

export default function PitchStepClient() {
    const { state, updateField } = useOnboardingState();
    const { next, back } = useStepNavigation('pitch');
    const [error, setError] = useState<string | null>(null);

    const handleNext = async () => {
        const result = pitchStepSchema.safeParse({ elevatorPitch: state.elevatorPitch });
        if (!result.success) {
            setError(result.error.errors[0].message);
            return false;
        }

        setError(null);
        trackOnboardingEvent('onboarding_step_completed', { step: 2, field: 'elevatorPitch' });
        next();
        return true;
    };

    return (
        <OnboardingStepWrapper
            currentStep={2}
            totalSteps={5}
            title={`What does ${state.brandName || 'your brand'} do?`}
            description="In one sentence, describe your core offering and value proposition."
            onNext={handleNext}
            onBack={back}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="elevatorPitch" className="text-base font-semibold">
                        Elevator Pitch
                    </Label>
                    <Textarea
                        id="elevatorPitch"
                        placeholder="e.g., A cozy coffee shop for remote workers, specializing in artisanal roasts and quiet workspaces."
                        value={state.elevatorPitch}
                        onChange={(e) => {
                            updateField('elevatorPitch', e.target.value);
                            if (error) setError(null);
                        }}
                        className="min-h-[120px] text-lg rounded-xl border-2 focus-visible:ring-primary shadow-sm resize-none"
                        autoFocus
                    />
                    <div className="flex justify-between items-center">
                        {error ? (
                            <p className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                                {error}
                            </p>
                        ) : (
                            <div />
                        )}
                        <p className="text-xs text-muted-foreground">
                            {state.elevatorPitch.length} / 200 characters
                        </p>
                    </div>
                </div>

                <div className="pt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-sm text-primary/80 leading-relaxed">
                        <span className="font-bold underline">Try this formula:</span> &quot;We help [target audience] [achieve result] by providing [your product/service].&quot;
                    </p>
                </div>
            </div>
        </OnboardingStepWrapper>
    );
}
