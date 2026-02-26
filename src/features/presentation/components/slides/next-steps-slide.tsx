'use client';

import { Brand, Logo } from '@/lib/types';
import { EditableText } from '../editable-text';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Mail } from 'lucide-react';
import Image from 'next/image';

interface NextStepsSlideProps {
    content: {
        deliverablesList: string[];
        nextStepsStatement: string;
        closingMessage: string;
    };
    isEditing: boolean;
    onUpdate: (updates: Record<string, unknown>) => void;
    brand: Brand;
    logo?: Logo;
}

export function NextStepsSlide({ content, isEditing, onUpdate, logo }: NextStepsSlideProps) {
    const deliverables = content.deliverablesList || [];
    const invertLogoSetting = !!logo?.displaySettings?.invertLogo;

    const updateDeliverable = (index: number, val: string) => {
        const newDevs = [...deliverables];
        newDevs[index] = val;
        onUpdate({ deliverablesList: newDevs });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-[8cqw] bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10cqw] w-full max-w-6xl">

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-10"
                >
                    <div className="space-y-6">
                        <h2 className="font-mono uppercase tracking-[0.3em] text-primary" style={{ fontSize: '1.2cqw' }}>What&apos;s Included</h2>
                        <div className="space-y-4">
                            {deliverables.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <CheckCircle2 className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                                    <EditableText
                                        value={item}
                                        onChange={(val) => updateDeliverable(i, val)}
                                        isEditing={isEditing}
                                        className="font-bold text-foreground"
                                        style={{ fontSize: '2cqw' }}
                                        placeholder={`Deliverable ${i + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-10 space-y-4">
                        <EditableText
                            value={content.closingMessage}
                            onChange={(val) => onUpdate({ closingMessage: val })}
                            isEditing={isEditing}
                            className="font-black tracking-tight leading-[1.1]"
                            style={{ fontSize: '3.5cqw' }}
                            placeholder="Final closing message..."
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col justify-center space-y-8 bg-muted/30 p-12 rounded-[3cqw] border-2 border-primary/5 shadow-2xl"
                >
                    <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-[0.4em] text-primary/60">
                        <ChevronRight className="w-4 h-4" />
                        <span>Ready to launch?</span>
                    </div>

                    <EditableText
                        value={content.nextStepsStatement}
                        onChange={(val) => onUpdate({ nextStepsStatement: val })}
                        isEditing={isEditing}
                        multiline
                        className="text-2xl font-medium leading-relaxed"
                        style={{ fontSize: '2cqw' }}
                        placeholder="What should the client do next?"
                    />

                    <div className="pt-8">
                        <div className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-primary/10 group cursor-pointer hover:border-primary transition-all">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[0.7cqw] font-mono uppercase tracking-widest opacity-40">Direct Contact</p>
                                <p className="font-bold text-[1.4cqw]">hello@colater.ai</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 flex justify-center opacity-10">
                        {logo?.logoUrl && (
                            <div className="relative w-16 h-16 grayscale">
                                <Image src={logo.logoUrl} alt="Final Mark" fill className="object-contain" style={{ filter: invertLogoSetting ? 'invert(1)' : '' }} />
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
