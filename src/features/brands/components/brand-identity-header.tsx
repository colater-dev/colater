import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, MessageSquare, Share2, Trash2, Presentation, Settings } from 'lucide-react';
import type { Logo } from '@/lib/types';
import { useState } from 'react';

interface BrandIdentityHeaderProps {
  brandId: string;
  isGeneratingConcept: boolean;
  onGenerateConcept: () => void;
  logoConcept: string | null;
  onConceptChange: (concept: string) => void;
  selectedProvider: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana';
  setSelectedProvider: (provider: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana') => void;
  isGeneratingLogo: boolean;
  onGenerateLogo: (provider: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana') => void;
  showCritique: boolean;
  setShowCritique: (show: boolean) => void;
  isCritiquing: boolean;
  onCritiqueLogo: () => void;
  currentLogo: Logo | undefined;
  onShareLogo: () => void;
  onDeleteLogo?: () => Promise<void>;
}

export function BrandIdentityHeader({
  brandId,
  isGeneratingConcept,
  onGenerateConcept,
  logoConcept,
  selectedProvider,
  setSelectedProvider,
  isGeneratingLogo,
  onGenerateLogo,
  showCritique,
  setShowCritique,
  isCritiquing,
  onCritiqueLogo,
  currentLogo,
  onShareLogo,
  onDeleteLogo,
}: BrandIdentityHeaderProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <CardHeader className="flex flex-col lg:flex-row items-start justify-between gap-4 p-0">
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={onGenerateConcept}
          disabled={isGeneratingConcept}
        >
          {isGeneratingConcept ? (
            <>
              <Loader2 className="mr-2 animate-spin" />
              Writing concept...
            </>
          ) : (
            'Generate Brand Concept'
          )}
        </Button>
        {logoConcept && (
          <>
            <Select value={selectedProvider} onValueChange={(value: 'gemini' | 'openai' | 'ideogram' | 'reve' | 'nano-banana') => setSelectedProvider(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nano-banana">Nano Banana Pro</SelectItem>
                <SelectItem value="ideogram">Ideogram v3</SelectItem>
                <SelectItem value="reve">Reve</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => onGenerateLogo(selectedProvider)}
              disabled={isGeneratingLogo || !logoConcept}
            >
              {isGeneratingLogo ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Creating logo...
                </>
              ) : (
                'Generate Logo'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (currentLogo?.critique) {
                  setShowCritique(!showCritique);
                } else {
                  onCritiqueLogo();
                  setShowCritique(true);
                }
              }}
              disabled={isCritiquing || !currentLogo}
            >
              {isCritiquing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Critiquing...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {currentLogo?.critique ? (showCritique ? 'Hide Critique' : 'Show Critique') : 'Critique'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onShareLogo}
              disabled={!currentLogo}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Link href={`/brands/${brandId}/presentation`}>
              <Button variant="outline">
                <Presentation className="mr-2 h-4 w-4" />
                Present
              </Button>
            </Link>
            <Link href={`/brands/${brandId}/settings?tab=integrations`}>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>

            {onDeleteLogo && currentLogo && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Logo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the logo from your collection. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async (e) => {
                        e.preventDefault();
                        setIsDeleting(true);
                        await onDeleteLogo();
                        setIsDeleting(false);
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </div>
    </CardHeader>
  );
}
