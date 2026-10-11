export interface SlideBrief {
  name: string;
  pitch: string;
  audienceTags: string[];
  styleTags: string[];
  idea: string;
  feedback?: { chips: string[]; note?: string };
}

export function feedbackLine(f?: SlideBrief['feedback']): string | null {
  if (!f || (!f.chips.length && !f.note)) return null;
  return `Feedback: ${f.chips.join(', ')}${f.note ? `. Note: ${f.note}` : ''}`;
}
