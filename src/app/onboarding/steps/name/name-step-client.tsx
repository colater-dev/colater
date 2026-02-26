'use client';

import { useOnboardingState } from '@/features/onboarding/hooks/use-onboarding-state';
import { useStepNavigation } from '@/features/onboarding/hooks/use-step-navigation';
import { OnboardingStepWrapper } from '@/features/onboarding/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { nameStepSchema } from '@/features/onboarding/utils/validation-schemas';
import { trackOnboardingEvent } from '@/features/onboarding/utils/onboarding-analytics';
import { useState } from 'react';

export default function NameStepClient() {
    const { state, updateField } = useOnboardingState();
    const { next, back } = useStepNavigation('name');
    const [error, setError] = useState<string | null>(null);

    const handleNext = async () => {
        const result = nameStepSchema.safeParse({ brandName: state.brandName });
        if (!result.success) {
            setError(result.error.errors[0].message);
            return false;
        }

        setError(null);
        trackOnboardingEvent('onboarding_step_completed', { step: 1, field: 'brandName' });
        next();
        return true;
    };

    return (
        <OnboardingStepWrapper
            currentStep={1}
            totalSteps={5}
            title="Let's start with your brand name"
            description="Don't worry, you can always change this later."
            onNext={handleNext}
            onBack={back}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-base font-semibold">
                        Brand Name
                    </Label>
                    <Input
                        id="brandName"
                        placeholder="e.g., TechFlow, Café Luna, FitLife"
                        value={state.brandName}
                        onChange={(e) => {
                            updateField('brandName', e.target.value);
                            if (error) setError(null);
                        }}
                        className="h-14 text-xl rounded-xl border-2 focus-visible:ring-primary shadow-sm"
                        autoFocus
                    />
                    {error && (
                        <p className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}
                </div>

                <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-primary italic">Pro tip:</span> Keep it short, memorable, and easy to pronounce.
                    </p>
                </div>
            </div>
        </OnboardingStepWrapper>
    );
}
