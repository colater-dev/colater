'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
    { label: 'Setting up your brand workspace', duration: 1000 },
    { label: 'Preparing AI tools', duration: 1000 },
    { label: 'Redirecting to your brand...', duration: 500 },
];

const FUN_FACTS = [
    "You can generate logos, taglines, and presentations in one click",
    "All AI generation happens on-demand - nothing pre-generated",
    "Claude AI helps create contextual brand suggestions",
    "Your brand is being saved to your personal workspace",
];

export function GeneratingAnimation({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [randomFact] = useState(() =>
        FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]
    );

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (currentStep < STEPS.length) {
            timeout = setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, STEPS[currentStep].duration);
        } else {
            // Small delay after last step before calling completion
            timeout = setTimeout(onComplete, 1000);
        }

        return () => clearTimeout(timeout);
    }, [currentStep, onComplete]);

    return (
        <div className="w-full max-w-md space-y-12">
            {/* Animated Icon */}
            <div className="relative w-40 h-40 mx-auto">
                <motion.div
                    className="absolute inset-0 bg-primary/20 rounded-[2.5rem]"
                    animate={{
                        rotate: 360,
                        borderRadius: ["2.5rem", "4rem", "2.5rem"],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute inset-4 bg-primary/40 rounded-[2rem]"
                    animate={{
                        rotate: -360,
                        borderRadius: ["2rem", "3rem", "2rem"],
                        scale: [1, 0.9, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" strokeWidth={3} />
                </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 bg-card/50 backdrop-blur-sm border-2 border-primary/10 p-8 rounded-3xl shadow-xl">
                <h2 className="text-xl font-black text-center mb-6">Building Your Brand Identity</h2>
                {STEPS.map((step, index) => (
                    <motion.div
                        key={step.label}
                        className="flex items-center gap-4 py-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                            opacity: index <= currentStep ? 1 : 0.3,
                            x: 0
                        }}
                    >
                        {index < currentStep ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                        ) : index === currentStep ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
                        ) : (
                            <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
                        )}
                        <span className={cn(
                            'text-base font-semibold transition-colors',
                            index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                            {step.label}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Fun Fact */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-2 p-4"
            >
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Did you know?</span>
                <p className="text-sm text-muted-foreground italic font-medium leading-relaxed">
                    &quot;{randomFact}&quot;
                </p>
            </motion.div>
        </div>
    );
}
