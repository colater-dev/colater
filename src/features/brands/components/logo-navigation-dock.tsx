'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { Logo } from '@/lib/types';
import { useState, useEffect, memo } from 'react';
import { cropImageToContent } from '@/lib/image-utils';

interface LogoNavigationDockProps {
  logos: Logo[];
  currentLogoIndex: number;
  onLogoIndexChange: (index: number) => void;
}

interface DockItemProps {
  logo: Logo;
  isActive: boolean;
  index: number;
  onLogoIndexChange: (index: number) => void;
}

const DockItem = memo(function DockItem({ logo, isActive, index, onLogoIndexChange }: DockItemProps) {
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (logo.logoUrl) {
      cropImageToContent(logo.logoUrl).then(setCroppedUrl).catch(() => {
        // CORS or load failure — display original URL
      });
    }
  }, [logo.logoUrl]);

  const displayUrl = croppedUrl || logo.logoUrl;
  const shouldInvert = logo.displaySettings?.invertLogo;
  const contrast = logo.displaySettings?.logoContrast || 100;

  return (
    <button
      onClick={() => onLogoIndexChange(index)}
      className={`
        relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200
        ${isActive
          ? 'border-primary scale-125 shadow-lg z-10'
          : 'border-transparent hover:border-muted-foreground/50 opacity-70 hover:opacity-100 hover:scale-110'
        }
      `}
    >
      <div className="relative w-full h-full bg-white">
        <Image
          src={displayUrl}
          alt="Logo thumbnail"
          fill
          className="object-contain p-1"
          style={{
            filter: `contrast(${contrast}%) ${shouldInvert ? 'invert(1)' : ''}`.trim()
          }}
          unoptimized={displayUrl.startsWith('data:')}
        />
      </div>
    </button>
  );
});

export const LogoNavigationDock = memo(function LogoNavigationDock({
  logos,
  currentLogoIndex,
  onLogoIndexChange,
}: LogoNavigationDockProps) {
  if (!logos || logos.length <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentLogoIndex > 0) {
      onLogoIndexChange(currentLogoIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentLogoIndex < logos.length - 1) {
      onLogoIndexChange(currentLogoIndex + 1);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="container mx-auto max-w-7xl px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={currentLogoIndex === 0}
            className="flex-shrink-0 h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Logo Thumbnails */}
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="flex items-center gap-2 px-2 overflow-x-auto scrollbar-hide py-4 max-w-full">
              {logos.map((logo, index) => (
                <DockItem
                  key={logo.id || index}
                  logo={logo}
                  isActive={index === currentLogoIndex}
                  index={index}
                  onLogoIndexChange={onLogoIndexChange}
                />
              ))}
            </div>
          </div>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentLogoIndex === logos.length - 1}
            className="flex-shrink-0 h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

