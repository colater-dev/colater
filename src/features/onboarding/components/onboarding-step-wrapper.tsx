'use client';

import { ReactNode, useState } from 'react';
import { OnboardingProgress } from './onboarding-progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingStepWrapperProps {
    currentStep: number;
    totalSteps: number;
    title: string;
    description?: string;
    children: ReactNode;
    onNext: () => Promise<boolean>; // Returns true if validation passed
    onBack?: () => void;
    nextLabel?: string;
    backLabel?: string;
    isNextDisabled?: boolean;
}

export function OnboardingStepWrapper({
    currentStep,
    totalSteps,
    title,
    description,
    children,
    onNext,
    onBack,
    nextLabel = 'Continue',
    backLabel = 'Back',
    isNextDisabled = false,
}: OnboardingStepWrapperProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = async () => {
        setIsSubmitting(true);
        try {
            const isValid = await onNext();
            if (!isValid) {
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Navigation error:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col pt-12">
            {/* Progress Bar */}
            <OnboardingProgress current={currentStep} total={totalSteps} />

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-2xl space-y-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Title Section */}
                            <div className="text-center space-y-3">
                                <span className="text-primary font-bold tracking-wider uppercase text-xs">
                                    Step {currentStep} of {totalSteps}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-black text-foreground">{title}</h1>
                                {description && (
                                    <p className="text-lg text-muted-foreground font-medium">{description}</p>
                                )}
                            </div>

                            {/* Step Content */}
                            <div className="bg-card border-2 border-primary/5 rounded-3xl p-6 md:p-10 shadow-xl shadow-primary/5">
                                {children}
                            </div>

                            {/* Navigation */}
                            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
                                {onBack ? (
                                    <Button
                                        variant="ghost"
                                        onClick={onBack}
                                        disabled={isSubmitting}
                                        className="h-12 px-6 rounded-xl hover:bg-primary/5 font-semibold"
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        {backLabel}
                                    </Button>
                                ) : (
                                    <div className="hidden sm:block" />
                                )}

                                <Button
                                    onClick={handleNext}
                                    disabled={isNextDisabled || isSubmitting}
                                    className={cn(
                                        "h-12 px-8 min-w-[160px] rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all",
                                        isSubmitting && "opacity-80"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            {nextLabel}
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
