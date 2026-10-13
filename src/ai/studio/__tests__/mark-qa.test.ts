import { describe, it, expect } from 'vitest';
import { qaProblems, renderCheckedMark, type MarkQa } from '../mark-qa';

const good: MarkQa = { score: 8, hasWords: false, hasTextureOrShading: false, tooDetailed: false, tooThin: false, mergesSeveralIdeas: false, resemblesHateSymbol: false, fix: '' };
const img = (tag: string) => ({ buffer: Buffer.from(tag), contentType: 'image/png' });

describe('qaProblems', () => {
  it('is empty for a good mark', () => {
    expect(qaProblems(good)).toEqual([]);
  });
  it('names each problem, and a low score is a problem on its own', () => {
    expect(qaProblems({ ...good, hasWords: true, hasTextureOrShading: true })).toEqual(['contains words', 'has texture or shading']);
    expect(qaProblems({ ...good, score: 3 })).toEqual(['weak overall (3/10)']);
  });
});

describe('renderCheckedMark', () => {
  const setup = (qas: (MarkQa | Error)[]) => {
    const prompts: string[] = [];
    let n = 0;
    const deps = {
      render: async (_p: string, prompt: string) => { prompts.push(prompt); return img(`raw${prompts.length}`); },
      clean: async (i: { buffer: Buffer; contentType: string }) => img(`clean-${i.buffer.toString()}`),
      check: async () => { const q = qas[n++]; if (q instanceof Error) throw q; return q; },
    };
    return { deps, prompts };
  };

  it('keeps a mark that passes, rendering once', async () => {
    const { deps, prompts } = setup([good]);
    const r = await renderCheckedMark(deps, 'recraft', 'two arcs');
    expect(prompts).toEqual(['two arcs']);
    expect(r.buffer.toString()).toBe('clean-raw1');
    expect(r.qa?.score).toBe(8);
  });

  it('re-renders once with the problems spelled out, keeping the better of the two', async () => {
    const { deps, prompts } = setup([{ ...good, score: 4, hasTextureOrShading: true, fix: 'use flat fills' }, { ...good, score: 7 }]);
    const r = await renderCheckedMark(deps, 'recraft', 'two arcs');
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain('two arcs');
    expect(prompts[1]).toContain('has texture or shading');
    expect(prompts[1]).toContain('use flat fills');
    expect(r.buffer.toString()).toBe('clean-raw2');
  });

  it('keeps the first when the retry is worse', async () => {
    const { deps } = setup([{ ...good, score: 4 }, { ...good, score: 2 }]);
    expect((await renderCheckedMark(deps, 'recraft', 'p')).buffer.toString()).toBe('clean-raw1');
  });

  it('never keeps a mark resembling a hate symbol', async () => {
    const { deps } = setup([{ ...good, resemblesHateSymbol: true }, { ...good, score: 3, resemblesHateSymbol: true }]);
    await expect(renderCheckedMark(deps, 'recraft', 'p')).rejects.toThrow(/couldn't draw a safe mark/i);
    const ok = setup([{ ...good, score: 9, resemblesHateSymbol: true }, { ...good, score: 4 }]);
    expect((await renderCheckedMark(ok.deps, 'recraft', 'p')).buffer.toString()).toBe('clean-raw2');
  });

  it('a failing quality check never blocks the mark', async () => {
    const { deps, prompts } = setup([new Error('vision down')]);
    const r = await renderCheckedMark(deps, 'recraft', 'p');
    expect(prompts).toHaveLength(1);
    expect(r.buffer.toString()).toBe('clean-raw1');
    expect(r.qa).toBeUndefined();
  });
});
