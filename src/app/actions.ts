
"use server";

import { generateTaglines } from "@/ai/flows/generate-tagline";
import { generateLogo } from "@/ai/flows/generate-logo";
import { generateBrandDetails, type GenerateBrandDetailsOutput } from "@/ai/flows/generate-brand-details";
import { colorizeLogo, ColorizeLogoInput } from "@/ai/flows/colorize-logo";
import { generateLogoOpenAI } from "@/ai/flows/generate-logo-openai";
import { generateLogoFal } from "@/ai/flows/generate-logo-fal";
import { completeBrandDetails, type CompleteBrandDetailsOutput } from "@/ai/flows/complete-brand-details";
import { generateLogoConcept } from "@/ai/flows/generate-logo-concept";
import { critiqueLogo, CritiqueLogoInput, Critique } from "@/ai/flows/critique-logo";
import { vectoriseLogo } from "@/ai/flows/vectorise-logo";
import { generateStories, GenerateStoriesInput } from "@/ai/flows/generate-stories";
import { generatePresentationData, GeneratePresentationDataInput, type GeneratePresentationDataOutput } from "@/ai/flows/generate-presentation-data";
import { justifyLogo, JustifyLogoInput, Justification } from "@/ai/flows/justify-logo";
import { generatePresentationNarrative, PresentationNarrativeInput, PresentationNarrativeOutput } from "@/ai/flows/generate-presentation-narrative";
import { generateAudienceSuggestions, GenerateAudienceSuggestionsInput, GenerateAudienceSuggestionsOutput } from "@/ai/flows/generate-audience-suggestions";
import { requireServerAuth, isAllowedUrl } from "@/lib/server-auth";

export async function getTaglineSuggestions(
  idToken: string,
  name: string,
  elevatorPitch: string,
  audience: string,
  desirableCues: string,
  undesirableCues: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!name || !elevatorPitch || !audience) {
      return { success: false, error: "Brand details are required." };
    }
    const result = await generateTaglines({ name, elevatorPitch, audience, desirableCues, undesirableCues });
    return { success: true, data: result.taglines };
  } catch (error) {
    console.error("Error generating tagline suggestion:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while generating a tagline: ${errorMessage}`,
    };
  }
}

export async function getLogoSuggestion(
  idToken: string,
  name: string,
  elevatorPitch: string,
  audience: string,
  desirableCues: string,
  undesirableCues: string,
  concept?: string,
): Promise<{ success: boolean; data?: { logoUrl: string; prompt: string }; error?: string }> {
  console.log("getLogoSuggestion: Starting...");
  try {
    await requireServerAuth(idToken);
    if (!name || !elevatorPitch || !audience) {
      console.error("getLogoSuggestion: Missing brand details.");
      return { success: false, error: "Brand details are required." };
    }
    console.log("getLogoSuggestion: Brand details are present.");

    const result = await generateLogoFal({ name, elevatorPitch, audience, desirableCues, undesirableCues, concept });
    console.log("getLogoSuggestion: AI generation complete.");

    if (!result || !result.logoUrl) {
      console.error("getLogoSuggestion: AI did not return a logoUrl.");
      throw new Error("AI image generation failed to return a result.");
    }
    // Log the beginning of the data URI to confirm it's what we expect
    console.log("getLogoSuggestion: Received data URI from AI:", result.logoUrl.substring(0, 100));

    // Return the data URI directly - upload will happen on client side
    return { success: true, data: { logoUrl: result.logoUrl, prompt: result.prompt } };
  } catch (error) {
    console.error("Error in getLogoSuggestion action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while generating a logo: ${errorMessage}`,
    };
  }
}

export async function getLogoSuggestionOpenAI(
  idToken: string,
  name: string,
  elevatorPitch: string,
  audience: string,
  desirableCues: string,
  undesirableCues: string,
  options?: { size?: '512x512' | '768x768' | '1024x1024'; concept?: string }
): Promise<{ success: boolean; data?: { logoUrl: string; prompt: string }; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!name || !elevatorPitch || !audience) {
      return { success: false, error: "Brand details are required." };
    }
    const result = await generateLogoOpenAI({
      name,
      elevatorPitch,
      audience,
      desirableCues,
      undesirableCues,
      size: options?.size,
      concept: options?.concept,
    });
    if (!result || !result.logoUrl) {
      throw new Error("OpenAI image generation failed to return a result.");
    }
    return { success: true, data: { logoUrl: result.logoUrl, prompt: result.prompt } };
  } catch (error) {
    console.error("Error in getLogoSuggestionOpenAI action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `An unexpected error occurred while generating a logo (OpenAI): ${errorMessage}` };
  }
}

export async function getLogoSuggestionFal(
  idToken: string,
  name: string,
  elevatorPitch: string,
  audience: string,
  desirableCues: string,
  undesirableCues: string,
  concept?: string,
  model?: string,
): Promise<{ success: boolean; data?: { logoUrl: string; prompt: string }; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!name || !elevatorPitch || !audience) {
      return { success: false, error: "Brand details are required." };
    }
    const result = await generateLogoFal({
      name,
      elevatorPitch,
      audience,
      desirableCues,
      undesirableCues,
      concept,
      model,
    });
    if (!result || !result.logoUrl) {
      throw new Error("Fal image generation failed to return a result.");
    }
    return { success: true, data: { logoUrl: result.logoUrl, prompt: result.prompt } };
  } catch (error) {
    console.error("Error in getLogoSuggestionFal action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `An unexpected error occurred while generating a logo (Fal): ${errorMessage}` };
  }
}


export async function getBrandCompletion(
  idToken: string,
  name: string,
  elevatorPitch: string
): Promise<{ success: boolean; data?: CompleteBrandDetailsOutput; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!name || !elevatorPitch) {
      return { success: false, error: "Name and elevator pitch are required." };
    }
    const result = await completeBrandDetails({ name, elevatorPitch });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error completing brand details:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while completing brand details: ${errorMessage}`,
    };
  }
}

export async function getBrandSuggestions(idToken: string, topic: string): Promise<{ success: boolean; data?: GenerateBrandDetailsOutput; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!topic) {
      return { success: false, error: "Topic is required." };
    }
    const result = await generateBrandDetails({ topic });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating brand suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while generating brand details: ${errorMessage}`,
    };
  }
}

export async function convertUrlToDataUri(idToken: string, url: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!isAllowedUrl(url)) {
      return { success: false, error: 'URL not allowed. Only images from known storage providers are accepted.' };
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    // Firebase Storage URLs often return 'application/octet-stream'.
    // We know our logos are PNGs, so we'll explicitly set the MIME type.
    const contentType = 'image/png';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;
    return { success: true, data: dataUri };
  } catch (error) {
    console.error("Error converting URL to data URI:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `Could not process image for colorization: ${errorMessage}`,
    };
  }
}


export async function getColorizedLogo(
  idToken: string,
  input: ColorizeLogoInput,
): Promise<{ success: boolean; data?: { colorLogoUrl: string; palette: string[]; colorNames: string[] }; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!input.logoUrl || !input.name || !input.elevatorPitch || !input.audience) {
      return { success: false, error: "A logo and brand details are required to generate a color logo." };
    }

    const result = await colorizeLogo(input);

    // Return the data URI directly - upload will happen on client side
    return { success: true, data: result };
  } catch (error) {
    console.error("Error colorizing logo:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while colorizing the logo: ${errorMessage}`,
    };
  }
}

export async function getLogoConcept(
  idToken: string,
  name: string,
  elevatorPitch: string,
  audience: string,
  desirableCues: string,
  undesirableCues: string,
): Promise<{ success: boolean; data?: { concept: string; stylePrompt: string }; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!name || !elevatorPitch || !audience) {
      return { success: false, error: "Brand details are required." };
    }
    const result = await generateLogoConcept({ name, elevatorPitch, audience, desirableCues, undesirableCues });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating logo concept:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    return {
      success: false,
      error: `An unexpected error occurred while generating logo concept: ${errorMessage}`,
    };
  }
}

export async function getLogoCritique(
  idToken: string,
  input: CritiqueLogoInput
): Promise<{ success: boolean; data?: Critique; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!input.logoUrl || !input.brandName) {
      return { success: false, error: "Logo URL and brand name are required." };
    }
    const result = await critiqueLogo(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error critiquing logo:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while critiquing the logo: ${errorMessage}`,
    };
  }
}

export async function getVectorizedLogo(
  idToken: string,
  logoUrl: string
): Promise<{ success: boolean; data?: { vectorLogoUrl: string }; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!logoUrl) {
      return { success: false, error: "Logo URL is required." };
    }
    const result = await vectoriseLogo({ logoUrl });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error vectorizing logo:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while vectorizing the logo: ${errorMessage}`,
    };
  }
}

export async function getGeneratedStories(
  idToken: string,
  input: GenerateStoriesInput
): Promise<{ success: boolean; data?: Array<{ headline: string; body: string }>; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!input.name || !input.elevatorPitch) {
      return { success: false, error: "Name and elevator pitch are required." };
    }
    const result = await generateStories(input);
    return { success: true, data: result.stories };
  } catch (error) {
    console.error("Error generating stories:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while generating stories: ${errorMessage}`,
    };
  }
}

export async function getPresentationData(
  idToken: string,
  input: GeneratePresentationDataInput
): Promise<{ success: boolean; data?: GeneratePresentationDataOutput; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!input.name || !input.elevatorPitch || !input.concept) {
      return { success: false, error: "Name, elevator pitch, and concept are required." };
    }
    const result = await generatePresentationData(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating presentation data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while generating presentation data: ${errorMessage}`,
    };
  }
}

export async function getLogoJustification(
  idToken: string,
  input: JustifyLogoInput
): Promise<{ success: boolean; data?: Justification; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!input.logoUrl || !input.brandName) {
      return { success: false, error: "Logo URL and brand name are required." };
    }
    const result = await justifyLogo(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error justifying logo:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while justifying the logo: ${errorMessage}`,
    };
  }
}

export async function getPresentationNarrative(
  idToken: string,
  input: PresentationNarrativeInput
): Promise<{ success: boolean; data?: PresentationNarrativeOutput; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!input.brandName || !input.elevatorPitch || !input.targetAudience) {
      return { success: false, error: "Brand name, elevator pitch, and audience are required." };
    }
    const result = await generatePresentationNarrative(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating presentation narrative:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while generating presentation narrative: ${errorMessage}`,
    };
  }
}

export async function getAudienceSuggestions(
  idToken: string,
  input: GenerateAudienceSuggestionsInput
): Promise<{ success: boolean; data?: GenerateAudienceSuggestionsOutput; error?: string }> {
  try {
    await requireServerAuth(idToken);
    if (!input.brandName || !input.elevatorPitch) {
      return { success: false, error: "Brand name and elevator pitch are required." };
    }
    const result = await generateAudienceSuggestions(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating audience suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `An unexpected error occurred while generating audience suggestions: ${errorMessage}`,
    };
  }
}

