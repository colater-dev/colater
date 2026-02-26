'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND_FONTS } from '@/config/brand-fonts';
import { shiftHue, darkenColor, isLightColor, lightenColor } from '@/lib/color-utils';
import type { Logo } from '@/lib/types';
import { BrandApplications } from './brand-applications';
import { BrandIdentityHeader } from './brand-identity-header';
import { LogoShowcase } from './logo-showcase';
import { LogoNavigationDock } from './logo-navigation-dock';
import { useToast } from '@/hooks/use-toast';

interface BrandIdentityCardProps {
  brandId: string;
  brandName: string;
  primaryTagline: string;
  logos: Logo[] | null;
  currentLogoIndex: number;
  isLoadingLogos: boolean;
  isGeneratingLogo: boolean;
  isGeneratingConcept: boolean;
  isColorizing: boolean;
  isLoadingTaglines: boolean;
  logoConcept: string | null;
  onGenerateConcept: () => void;
  onConceptChange: (concept: string) => void;
  onGenerateLogo: (provider: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana') => void;
  onColorizeLogo: () => void;
  onLogoIndexChange: (index: number) => void;
  onCritiqueLogo: () => void;
  isCritiquing: boolean;
  onLogoFontChange: (logoId: string, font: string) => void;
  onSaveDisplaySettings?: (logoId: string, settings: Logo['displaySettings']) => void;
  onMakeLogoPublic?: (logoId: string) => Promise<void>;
  readOnly?: boolean;
  selectedProvider: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana';
  setSelectedProvider: (provider: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana') => void;
  onSaveExternalMedia?: (logoId: string, url: string) => void;
  onDeleteColorVersion?: (index: number) => void;
  onVectorizeLogo?: (croppedLogoUrl: string) => void;
  animationType?: 'fade' | 'slide' | 'scale' | 'logoAnimation' | null;
  isVectorizing?: boolean;
  onBrandNameChange?: (name: string, elevatorPitch: string) => Promise<void>;
  onDeleteLogo?: () => Promise<void>;
  onSaveCropDetails?: (logoId: string, cropDetails: { x: number; y: number; width: number; height: number }) => Promise<void>;
}

export function BrandIdentityCard({
  brandId,
  brandName,
  primaryTagline,
  logos,
  currentLogoIndex,
  isGeneratingLogo,
  isGeneratingConcept,
  isColorizing,
  logoConcept,
  onGenerateConcept,
  onConceptChange,
  onGenerateLogo,
  onColorizeLogo,
  onLogoIndexChange,
  onCritiqueLogo,
  isCritiquing,
  onLogoFontChange,
  onSaveDisplaySettings,
  onMakeLogoPublic,
  readOnly = false,
  selectedProvider,
  setSelectedProvider,
  onSaveExternalMedia,
  onDeleteColorVersion,
  onVectorizeLogo,
  isVectorizing,
  onBrandNameChange,
  onDeleteLogo,
  onSaveCropDetails,
}: BrandIdentityCardProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(brandName);
  const [editElevatorPitch, setEditElevatorPitch] = useState(primaryTagline);
  const [isSaving, setIsSaving] = useState(false);

  const [showCritique, setShowCritique] = useState(false);
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);
  const [hueShifts, setHueShifts] = useState<Record<number, number>>({});

  const [logoScale, setLogoScale] = useState(1);
  const [horizontalLogoTextGap, setHorizontalLogoTextGap] = useState(50);
  const [horizontalLogoTextBalance, setHorizontalLogoTextBalance] = useState(50);
  const [verticalLogoTextGap, setVerticalLogoTextGap] = useState(50);
  const [verticalLogoTextBalance, setVerticalLogoTextBalance] = useState(50);

  const [logoContrast, setLogoContrast] = useState(200);

  const [showBrandName, setShowBrandName] = useState(true);
  const [invertLogo, setInvertLogo] = useState(true);
  const [textTransform, setTextTransform] = useState<'none' | 'lowercase' | 'capitalize' | 'uppercase'>('none');
  const [externalMediaUrl, setExternalMediaUrl] = useState('');

  const [isSavingMedia, setIsSavingMedia] = useState(false);

  // Loading state management
  const [viewingGeneration, setViewingGeneration] = useState(false);

  // Reset viewingGeneration when generation starts
  useEffect(() => {
    if (isGeneratingLogo) {
      setViewingGeneration(true);
    }
  }, [isGeneratingLogo]);


  const [animationType, setAnimationType] = useState<'fade' | 'slide' | 'scale' | 'logoAnimation' | null>('logoAnimation');
  const [animationKey, setAnimationKey] = useState(0);

  const triggerAnimation = (type: 'fade' | 'slide' | 'scale' | 'logoAnimation') => {
    setAnimationType(type);
    setAnimationKey(prev => prev + 1);
  };


  const [cardModes, setCardModes] = useState<Record<string, number>>({});

  const getCardMode = (key: string, defaultInvert: boolean) => {
    if (cardModes[key] !== undefined) return cardModes[key];
    return defaultInvert ? 2 : 0;
  };

  const cycleCardMode = (key: string, defaultInvert: boolean) => {
    const current = getCardMode(key, defaultInvert);
    setCardModes(prev => ({ ...prev, [key]: (current + 1) % 4 }));
  };

  const getModeStyles = (mode: number) => {
    switch (mode) {
      case 0: return { mixBlendMode: 'darken' as const, filter: 'none' };
      case 1: return { mixBlendMode: 'lighten' as const, filter: 'none' };
      case 2: return { mixBlendMode: 'lighten' as const, filter: 'invert(1)' };
      case 3: return { mixBlendMode: 'darken' as const, filter: 'invert(1)' };
      default: return { mixBlendMode: 'darken' as const, filter: 'none' };
    }
  };

  const currentLogo = logos?.[currentLogoIndex];

  // Track slide direction synchronously during render to avoid AnimatePresence glitches
  const prevLogoIndexRef = useRef(currentLogoIndex);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  if (prevLogoIndexRef.current !== currentLogoIndex) {
    const direction = prevLogoIndexRef.current < currentLogoIndex ? 'right' : 'left';
    setSlideDirection(direction);
    prevLogoIndexRef.current = currentLogoIndex;
  }

  // Pick a random animation type for the reveal on logo switch
  useEffect(() => {
    // We already updated prevLogoIndexRef.current above, so we need another way to detect change or just use currentLogoIndex
    const animationTypes: ('fade' | 'slide' | 'scale' | 'logoAnimation')[] = ['fade', 'slide', 'scale', 'logoAnimation'];
    const randomType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
    triggerAnimation(randomType);
  }, [currentLogoIndex]);

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 20 : -20,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -20 : 20,
      opacity: 0
    })
  };

  const handleShareLogo = async () => {
    if (!currentLogo) return;

    // Check if logo is already public, if not make it public first
    if (!currentLogo.isPublic && onMakeLogoPublic) {
      try {
        await onMakeLogoPublic(currentLogo.id);
      } catch {
        toast({
          variant: 'destructive',
          title: 'Failed to share',
          description: 'Could not make logo public. Please try again.',
        });
        return;
      }
    }

    const url = `${window.location.origin}/brands/${currentLogo.brandId}/logos/${currentLogo.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Anyone with this link can now view this logo.',
    });
  };

  // Load display settings from current logo
  useEffect(() => {
    if (currentLogo?.displaySettings) {
      setTextTransform(currentLogo.displaySettings.textTransform);
      setShowBrandName(currentLogo.displaySettings.showBrandName);
      setInvertLogo(currentLogo.displaySettings.invertLogo);

      // Load new settings or fallback to old ones
      setHorizontalLogoTextGap(currentLogo.displaySettings.horizontalLogoTextGap ?? currentLogo.displaySettings.logoTextGap ?? 50);
      setHorizontalLogoTextBalance(currentLogo.displaySettings.horizontalLogoTextBalance ?? currentLogo.displaySettings.logoTextBalance ?? 50);
      setVerticalLogoTextGap(currentLogo.displaySettings.verticalLogoTextGap ?? currentLogo.displaySettings.logoTextGap ?? 50);
      setVerticalLogoTextBalance(currentLogo.displaySettings.verticalLogoTextBalance ?? currentLogo.displaySettings.logoTextBalance ?? 50);

      setLogoContrast(currentLogo.displaySettings.logoContrast);
    }
    if (currentLogo?.externalMediaUrl) {
      setExternalMediaUrl(currentLogo.externalMediaUrl);
    } else {
      setExternalMediaUrl('');
    }
  }, [currentLogo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save of display settings
  const saveTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  useEffect(() => {
    if (!currentLogo || !onSaveDisplaySettings) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      const settings = {
        textTransform,
        showBrandName,
        invertLogo,
        horizontalLogoTextGap,
        horizontalLogoTextBalance,
        verticalLogoTextGap,
        verticalLogoTextBalance,
        logoContrast,
      };
      onSaveDisplaySettings(currentLogo.id, settings);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentLogo?.id, textTransform, showBrandName, invertLogo, horizontalLogoTextGap, horizontalLogoTextBalance, verticalLogoTextGap, verticalLogoTextBalance, logoContrast, onSaveDisplaySettings]); // eslint-disable-line react-hooks/exhaustive-deps


  // Reset hue shifts when logo changes
  useEffect(() => {
    setHueShifts({});
  }, [currentLogo?.id]);

  // Close expanded point when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setExpandedPointId(null);
    };

    if (expandedPointId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [expandedPointId]);

  return (
    <Card className="w-full">
      {/* Brand Name and Elevator Pitch at Top */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-3xl font-bold">{brandName}</CardTitle>
            <CardDescription className="mt-2 text-base">{primaryTagline}</CardDescription>
          </div>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(brandName);
                setEditElevatorPitch(primaryTagline);
                setIsEditDialogOpen(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      {!readOnly && (
        <BrandIdentityHeader
          brandId={brandId}
          isGeneratingConcept={isGeneratingConcept}
          onGenerateConcept={onGenerateConcept}
          logoConcept={logoConcept}
          onConceptChange={onConceptChange}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          isGeneratingLogo={isGeneratingLogo}
          onGenerateLogo={onGenerateLogo}
          showCritique={showCritique}
          setShowCritique={setShowCritique}
          isCritiquing={isCritiquing}
          onCritiqueLogo={onCritiqueLogo}
          currentLogo={currentLogo}
          onShareLogo={handleShareLogo}
          onDeleteLogo={onDeleteLogo}
        />
      )}
      <CardContent className="flex flex-col items-center justify-center text-center space-y-6 p-0">
        <div className="w-full space-y-4 pt-6 flex flex-col items-center overflow-hidden relative">
          {/* Logo Applications Showcase */}
          <AnimatePresence custom={slideDirection}>
            {isGeneratingLogo && viewingGeneration ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full mt-8 flex flex-col items-center justify-center min-h-[480px]"
              >
                <div className="w-full h-[480px] bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden animate-pulse">
                </div>
              </motion.div>
            ) : currentLogo?.logoUrl ? (
              <motion.div
                key={currentLogo.id}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <LogoShowcase
                  currentLogo={currentLogo}
                  brandName={brandName}
                  selectedBrandFont={currentLogo.font || 'Inter'}
                  onFontChange={(font: string) => onLogoFontChange(currentLogo.id, font)}
                  showCritique={showCritique}
                  expandedPointId={expandedPointId}
                  setExpandedPointId={setExpandedPointId}
                  hueShifts={hueShifts}
                  setHueShifts={setHueShifts}
                  cardModes={cardModes}
                  cycleCardMode={cycleCardMode}
                  getCardMode={getCardMode}
                  getModeStyles={getModeStyles}
                  onColorizeLogo={onColorizeLogo}
                  isColorizing={isColorizing}
                  isGeneratingLogo={isGeneratingLogo}
                  textTransform={textTransform}
                  setTextTransform={setTextTransform}
                  animationType={animationType}
                  triggerAnimation={triggerAnimation}
                  animationKey={animationKey}
                  showBrandName={showBrandName}
                  setShowBrandName={setShowBrandName}
                  invertLogo={invertLogo}
                  setInvertLogo={setInvertLogo}
                  horizontalLogoTextGap={horizontalLogoTextGap}
                  setHorizontalLogoTextGap={setHorizontalLogoTextGap}
                  horizontalLogoTextBalance={horizontalLogoTextBalance}
                  setHorizontalLogoTextBalance={setHorizontalLogoTextBalance}
                  verticalLogoTextGap={verticalLogoTextGap}
                  setVerticalLogoTextGap={setVerticalLogoTextGap}
                  verticalLogoTextBalance={verticalLogoTextBalance}
                  setVerticalLogoTextBalance={setVerticalLogoTextBalance}
                  logoContrast={logoContrast}
                  setLogoContrast={setLogoContrast}
                  readOnly={readOnly}
                  // External Media Props
                  externalMediaUrl={externalMediaUrl}
                  onExternalMediaChange={setExternalMediaUrl}
                  onDeleteColorVersion={onDeleteColorVersion}
                  onVectorizeLogo={onVectorizeLogo}
                  isVectorizing={isVectorizing}
                  isSavingMedia={isSavingMedia}
                  onSaveCropDetails={onSaveCropDetails}
                  onExternalMediaBlur={() => {
                    if (currentLogo && externalMediaUrl !== currentLogo.externalMediaUrl && onSaveExternalMedia) {
                      setIsSavingMedia(true);
                      onSaveExternalMedia(currentLogo.id, externalMediaUrl);
                      setTimeout(() => setIsSavingMedia(false), 1000);
                    }
                  }}
                  onFileUpload={async (file: File) => {
                    if (!file || !onSaveExternalMedia) return;

                    try {
                      setIsSavingMedia(true);
                      const { getPresignedUploadUrl } = await import('@/app/actions/upload-media');

                      // 1. Get presigned URL
                      const result = await getPresignedUploadUrl(file.type, file.name);
                      if (!result.success || !result.url || !result.publicUrl) {
                        throw new Error(result.error || 'Failed to get upload URL');
                      }

                      // 2. Upload file
                      const uploadResponse = await fetch(result.url, {
                        method: 'PUT',
                        body: file,
                        headers: {
                          'Content-Type': file.type,
                        },
                      });

                      if (!uploadResponse.ok) {
                        throw new Error('Failed to upload file');
                      }

                      // 3. Save URL
                      setExternalMediaUrl(result.publicUrl);
                      onSaveExternalMedia(currentLogo.id, result.publicUrl);

                      toast({
                        title: 'Upload Successful',
                        description: 'File uploaded and saved.',
                      });
                    } catch (error) {
                      console.error('Upload error:', error);
                      toast({
                        variant: 'destructive',
                        title: 'Upload Failed',
                        description: 'Could not upload file. Please check your R2 credentials.',
                      });
                    } finally {
                      setIsSavingMedia(false);
                    }
                  }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Brand Applications Section */}
          <AnimatePresence mode="wait" custom={slideDirection}>
            {(!isGeneratingLogo || !viewingGeneration) && currentLogo?.logoUrl && (
              <motion.div
                key={`applications-${currentLogo.id}`}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                {(() => {
                  // Determine primary color from palette or fallback
                  const colorVersions = currentLogo.colorVersions || [];
                  let primaryColor = '#000000';

                  if (colorVersions.length > 0 && colorVersions[0].palette.length > 0) {
                    primaryColor = colorVersions[0].palette[0];
                  } else if (currentLogo.palette && currentLogo.palette.length > 0) {
                    primaryColor = currentLogo.palette[0];
                  }

                  // Apply hue shift if applicable
                  if (colorVersions.length > 0) {
                    const currentHueShift = hueShifts[0] || 0;
                    primaryColor = shiftHue(primaryColor, currentHueShift);
                  }

                  return (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 w-fit self-end">
                        <Slider
                          value={[logoScale]}
                          onValueChange={(value) => setLogoScale(value[0])}
                          min={1}
                          max={2.0}
                          step={0.01}
                          className="w-32"
                        />
                        <span className="text-xs font-mono text-gray-400 w-8 text-right">{logoScale.toFixed(2)}x</span>
                      </div>
                      <BrandApplications
                        logoUrl={currentLogo.logoUrl}
                        brandName={brandName}
                        tagline={primaryTagline}
                        primaryColor={primaryColor}
                        fontVariable={BRAND_FONTS.find(f => f.name === (currentLogo.font || 'Inter'))?.variable || 'sans-serif'}
                        palette={colorVersions.length > 0 ? colorVersions[0].palette : currentLogo.palette || []}
                        logoScale={logoScale}
                        contrast={logoContrast / 100}
                        invert={invertLogo}
                      />
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Brand Palette Section - Show all color version palettes with hue shifts */}
          {currentLogo?.logoUrl && (() => {
            // Support new colorVersions structure and legacy fields
            const colorVersions = currentLogo.colorVersions || [];

            // Migrate legacy fields if needed
            if (colorVersions.length === 0 && currentLogo.colorLogoUrl) {
              colorVersions.push({ colorLogoUrl: currentLogo.colorLogoUrl, palette: currentLogo.palette || [] });
            }

            if (colorVersions.length > 0) {
              return (
                <div className="mt-8">
                  <div className="space-y-0">
                    {colorVersions.map((colorVersion, versionIndex) => {
                      const currentHueShift = hueShifts[versionIndex] || 0;
                      const shiftedPalette = colorVersion.palette.map(color => shiftHue(color, currentHueShift));

                      return shiftedPalette.map((color, colorIndex) => {
                        const darker1 = darkenColor(color, 0.15);
                        const darker2 = darkenColor(color, 0.3);
                        const lighter1 = lightenColor(color, 0.15);
                        const lighter2 = lightenColor(color, 0.3);

                        const shades = [darker2, darker1, color, lighter1, lighter2];

                        return (
                          <div key={`palette-v${versionIndex}-c${colorIndex}`}>
                            <div className="grid grid-cols-5 gap-0">
                              {shades.map((shade, shadeIndex) => {
                                const isLight = isLightColor(shade);
                                const textColor = isLight ? 'text-gray-900' : 'text-white';

                                return (
                                  <div
                                    key={`shade-${shadeIndex}`}
                                    className={`aspect-square flex items-center justify-center ${textColor}`}
                                    style={{ backgroundColor: shade }}
                                  >
                                    <p className="text-xs font-mono">{shade.toUpperCase()}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>



      </CardContent>

      {/* Edit Brand Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Update your brand name and elevator pitch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">Brand Name</label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Brand name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-pitch" className="text-sm font-medium">Elevator Pitch</label>
              <Textarea
                id="edit-pitch"
                value={editElevatorPitch}
                onChange={(e) => setEditElevatorPitch(e.target.value)}
                placeholder="Describe your brand in a few sentences."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!onBrandNameChange) return;
                if (!editName.trim() || !editElevatorPitch.trim()) {
                  toast({
                    variant: 'destructive',
                    title: 'Validation Error',
                    description: 'Brand name and elevator pitch are required.',
                  });
                  return;
                }
                setIsSaving(true);
                try {
                  await onBrandNameChange(editName.trim(), editElevatorPitch.trim());
                  setIsEditDialogOpen(false);
                  toast({
                    title: 'Brand Updated',
                    description: 'Your brand information has been updated.',
                  });
                } catch (error) {
                  toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: error instanceof Error ? error.message : 'Could not update brand.',
                  });
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogoNavigationDock
        logos={logos || []}
        currentLogoIndex={currentLogoIndex}
        onLogoIndexChange={(index) => {
          setViewingGeneration(false);
          onLogoIndexChange(index);
        }}
      />
    </Card>
  );
}
