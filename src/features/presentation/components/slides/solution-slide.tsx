'use client';

import { EditableText } from '../editable-text';
import { motion } from 'framer-motion';
import { Sparkles, Target, Zap } from 'lucide-react';

interface SolutionSlideProps {
    content: {
        solutionStatement: string;
        keyAttributes: string[];
        targetAudienceStatement: string;
    };
    isEditing: boolean;
    onUpdate: (updates: Record<string, unknown>) => void;
}

export function SolutionSlide({ content, isEditing, onUpdate }: SolutionSlideProps) {
    const attributes = content.keyAttributes || [];

    const updateAttribute = (index: number, val: string) => {
        const newAttrs = [...attributes];
        newAttrs[index] = val;
        onUpdate({ keyAttributes: newAttrs });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-[8cqw] bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_40cqw] gap-[6cqw] items-center w-full max-w-6xl">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-primary font-mono uppercase tracking-widest text-sm">
                            <Sparkles className="w-4 h-4" />
                            <span>The Solution</span>
                        </div>
                        <EditableText
                            value={content.solutionStatement}
                            onChange={(val) => onUpdate({ solutionStatement: val })}
                            isEditing={isEditing}
                            multiline
                            className="font-black tracking-tight leading-none"
                            style={{ fontSize: '4.5cqw' }}
                            placeholder="Our approach to solving the challenge..."
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-muted-foreground font-mono uppercase tracking-widest text-xs">
                            <Target className="w-4 h-4" />
                            <span>Target Audience</span>
                        </div>
                        <EditableText
                            value={content.targetAudienceStatement}
                            onChange={(val) => onUpdate({ targetAudienceStatement: val })}
                            isEditing={isEditing}
                            multiline
                            className="text-xl font-medium leading-relaxed"
                            style={{ fontSize: '1.8cqw' }}
                            placeholder="Who this brand is built for..."
                        />
                    </div>
                </motion.div>

                <div className="space-y-6 bg-background p-10 rounded-[3cqw] shadow-xl border-2 border-primary/5">
                    <div className="flex items-center gap-2 text-primary/60 font-mono uppercase tracking-widest text-xs mb-4">
                        <Zap className="w-4 h-4" />
                        <span>Key Attributes</span>
                    </div>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="group flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            <EditableText
                                value={attributes[i] || ""}
                                onChange={(val) => updateAttribute(i, val)}
                                isEditing={isEditing}
                                className="font-bold tracking-tight text-foreground"
                                style={{ fontSize: '2.5cqw' }}
                                placeholder={`Attribute ${i + 1}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
