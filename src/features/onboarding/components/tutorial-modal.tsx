'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Layout, Palette, Download, Check } from 'lucide-react';

const TUTORIAL_STEPS = [
    {
        title: 'Welcome to your brand dashboard!',
        description: 'We\'ve generated your first concepts. Here\'s how to make them perfect.',
        icon: Sparkles,
        color: 'text-yellow-500',
    },
    {
        title: 'Explore Layouts',
        description: 'See your logo on different backgrounds and containers to test its versatility.',
        icon: Layout,
        color: 'text-blue-500',
    },
    {
        title: 'Customize Your Style',
        description: 'Adjust colors, fonts, and taglines until they perfectly match your vision.',
        icon: Palette,
        color: 'text-purple-500',
    },
    {
        title: 'Ready to Launch',
        description: 'Download high-quality assets or share your brand kit with the world.',
        icon: Download,
        color: 'text-green-500',
    },
];

export function TutorialModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const step = TUTORIAL_STEPS[currentStep];
    const Icon = step.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border-2 border-primary/20 rounded-3xl p-0 overflow-hidden">
                <div className="p-8 space-y-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="flex flex-col items-center text-center space-y-6"
                        >
                            <div className={`p-4 rounded-2xl bg-muted shadow-inner`}>
                                <Icon className={`w-12 h-12 ${step.color}`} />
                            </div>
                            <div className="space-y-2">
                                <DialogTitle className="text-2xl font-black">{step.title}</DialogTitle>
                                <DialogDescription className="text-base text-muted-foreground font-medium">
                                    {step.description}
                                </DialogDescription>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2">
                        {TUTORIAL_STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 transition-all rounded-full ${i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'}`}
                            />
                        ))}
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground font-bold"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="min-w-[120px] rounded-xl font-bold shadow-lg"
                        >
                            {currentStep === TUTORIAL_STEPS.length - 1 ? (
                                <>
                                    Get Started
                                    <Check className="ml-2 w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
