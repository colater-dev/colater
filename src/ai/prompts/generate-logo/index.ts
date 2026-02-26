import type {GenerateLogoInput} from '@/ai/flows/generate-logo';
import {buildPrompt as modernMinimal} from './modern-minimal';
import {buildPrompt as geometricSymbol} from './geometric-symbol';
import {buildPrompt as letterInitial} from './letter-initial';
type PromptBuilder = (input: GenerateLogoInput) => string;

export const generateLogoPrompts: Record<string, PromptBuilder> = {
  'modern-minimal': modernMinimal,
  'geometric-symbol': geometricSymbol,
  'letter-initial': letterInitial,
};

export function getGenerateLogoPrompt(
  name: string | undefined,
  input: GenerateLogoInput
): { key: string; prompt: string } {
  const availableKeys = Object.keys(generateLogoPrompts);
  const key = name && generateLogoPrompts[name]
    ? name
    : availableKeys[Math.floor(Math.random() * availableKeys.length)];
  console.log(`[generate-logo] Using prompt: ${key}`);
  return { key, prompt: generateLogoPrompts[key](input) };
}