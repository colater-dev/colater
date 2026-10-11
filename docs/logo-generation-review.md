# Studio logo generations: review (2026-10-12)

Reviewed all 47 marks generated so far (local emulator). Average **4.6/10**.

By model: Nano Banana 4.8, Recraft 4.6, GPT Image 4.4. These are about equal, so the problem is the prompts, not the model.
By idea type: abstract-geometric 5.5, lettermark 4.4, negative-space 4.3, literal-symbol 4.0.

## Recurring failures
1. Several metaphors crammed into one mark ("box morphed into a smiling cocktail glass").
2. Little variety within a brand: Neels AI got nodes + checkmark 5 of 6 times; Tidepool got a heart in negative space 5 times.
3. Hidden negative-space shapes (checks, hearts, arrows) rarely show up in the image.
4. Faces and smiles added for "friendly" turn into clip art.
5. Literal category clichés: gears, dumbbells, robot arms, coffee cups.
6. Textures and illustration detail (brush strokes, wood grain, film strip).
7. Image glitches: dark grey instead of black, a picture frame.
8. One mark (#40) reads as a swastika.

## Pipeline changes
- Concept prompt: one idea, 2-4 bold shapes, must read as a 16px favicon; no faces except in mascot directions; avoid category clichés; avoid hate/loaded symbols; markPrompt gives concrete geometry with exact counts and symmetry.
- Ideas already on the brand's page are passed in so new directions differ.
- New idea types modelled on curated galleries (logofolio.com): monoline, mascot, modular (stripes, layers, dots, rings, segments). Sharper guidance for literal-symbol, lettermark and negative-space.
- Image prompt style rule: flat vector, centered, ~60% of canvas, consistent strokes, no words; black-on-white rule now explicitly says pure #000000 and no grey.
- Server cleanup (`mark-cleanup.ts`): levels push grey to pure black and near-white to white (edges kept); frames removed.
- Vision check (`mark-qa.ts`): Claude scores each cleaned mark and flags words, texture, detail, mashed-up ideas and hate-symbol lookalikes. One re-render with the problems spelled out; the better of the two is kept; a hate-symbol lookalike is never kept. The verdict is stored as `markQa` on the direction.

## After the changes (8 test jobs on the four weakest brands)
Average ~5.5 by the vision check (my own scores: ~5). The failure types above didn't appear; the marks are cleaner but still more correct than clever. A brainstorm-5-ideas-first step was tried and dropped: no gain, and extra latency. Nano Banana and Recraft render timeouts (60s) under fal queue load cost 3 of 16 jobs.

## Per-logo ratings
| # | Brand | Model | Type | Idea | Score | Note |
|---|---|---|---|---|---|---|
| 0 | Tidepool | gpt-image | lettermark | Letter T shaped as a smiling pool with gentle ripples. | 6 | Clear T + ripples, but generic; ripples thin against the bar |
| 1 | Tidepool | recraft | negative-space | Parent and child form a heart in negative space. | 5 | Hidden heart barely reads; looks like letters |
| 2 | Tidepool | nano-banana | abstract-geometric | Overlapping circles creating gentle ripples and safe enclosure. | 6 | Pleasant but generic; came out dark grey |
| 3 | Tidepool | recraft | lettermark | Bold 'T' shaped as embracing arms around a calm water ripple. | 4 | Clumsy T with an orphan ring |
| 4 | Tidepool | gpt-image | abstract-geometric | Two overlapping rounded shapes forming a friendly, approachable wave. | 6 | Simple wave; overlap gap is awkward |
| 5 | Tidepool | nano-banana | negative-space | Parent and child forms create a gentle ripple between them. | 5 | Reads as a shutter or hazard sign |
| 6 | Tidepool | recraft | abstract-geometric | Two overlapping circles form a gentle heart in negative space. | 7 | Clean; subtle heart, balanced |
| 7 | Tidepool | nano-banana | literal-symbol | Two gentle waves form a heart between parent and child swimmers. | 6 | Decent, but crowded |
| 8 | Tidepool | gpt-image | lettermark | Letter T shaped as two swimmers forming a gentle heart | 3 | T + two swimmers + heart + waves: far too much |
| 9 | Ligt | recraft | literal-symbol | A friendly dumbbell with a smiling face built into the weight. | 3 | Clip-art dumbbell with a smiley |
| 10 | Ligt | gpt-image | abstract-geometric | Stacked bars forming an upward arrow through progressive alignment. | 6 | Simple stepped bars; generic |
| 11 | Ligt | nano-banana | lettermark | L monogram formed by stacked barbell plates counting upward. | 5 | Stairs; the L barely reads |
| 12 | Ligt | recraft | lettermark | Letter 'L' formed by stacked horizontal bars representing progressive weight plates. | 4 | Looks like a traffic cone |
| 13 | Ligt | nano-banana | literal-symbol | A smiling dumbbell with a simple, friendly face. | 4 | Smiley dumbbell, clip art |
| 14 | Ligt | gpt-image | abstract-geometric | Ascending bars form an upward arrow through negative space. | 6 | Bars with an arrow; perspective is inconsistent |
| 15 | Tidepool | gpt-image | literal-symbol | Parent duck with duckling floating together on gentle ripples. | 5 | Charming, but an illustration; too detailed |
| 16 | Tidepool | recraft | lettermark | T and P letterforms merge into a gentle rippling water surface. | 7 | Expressive TP monogram; distinctive |
| 17 | Neels AI | recraft | negative-space | Overlapping workflow nodes reveal a calm checkmark in negative space. | 6 | Checkmark in the negative space barely reads |
| 18 | Neels AI | gpt-image | literal-symbol | Interlocking gear nodes forming a simplified circuit pathway. | 3 | Stock gears and org chart |
| 19 | Neels AI | nano-banana | abstract-geometric | Overlapping rounded squares forming a flowing, connected node pattern. | 5 | Generic app-icon squares |
| 20 | Neels AI | recraft | literal-symbol | Interconnected circuit nodes form a check symbol in negative space. | 4 | Molecule cliché; the check is invisible |
| 21 | Neels AI | nano-banana | negative-space | Three soft rounded nodes connect, forming a gentle checkmark in center. | 5 | Muddled Venn diagram with a check |
| 22 | Neels AI | gpt-image | lettermark | Letter N formed by three connected workflow nodes creating checkmark negative space. | 5 | Busy N of nodes; artifacts |
| 23 | Tidepool | recraft | abstract-geometric | Overlapping circles forming a gentle wave and smile shape. | 6 | Simple circles; fine |
| 24 | Fever Dream | gpt-image | abstract-geometric | Overlapping circles and crescents creating a surreal, fluid constellation. | 5 | Crescent trio; reads as bubbles |
| 25 | Fever Dream | nano-banana | lettermark | FD monogram where letters morph and melt into each other. | 6 | Melting FD has energy; artifacts |
| 26 | Fever Dream | recraft | literal-symbol | A sleeping eye with a film strip unspooling from it. | 2 | Eye + lashes + film strip: illustration, fails small |
| 27 | Fever Dream | gpt-image | lettermark | F and D dance together as overlapping moons in dreamlike orbit. | 4 | Messy overlap; stray "3" |
| 28 | Fever Dream | gpt-image | negative-space | Lightning bolt forms a sleeping face in its negative space. | 4 | Lightning bolt + face, cheesy |
| 29 | Cafe Chauciao | recraft | abstract-geometric | Overlapping circles form a warm embrace, suggesting gathering and transition. | 3 | User: "looks like a monkey's face" |
| 30 | Cafe Chauciao | nano-banana | literal-symbol | Coffee cup with steam curling into a crescent moon above. | 5 | Clean but generic coffee cup |
| 31 | Cafe Chauciao | gpt-image | negative-space | Coffee cup steam curls form a crescent moon in negative space. | 3 | Brush texture, not flat |
| 32 | Tidepool | recraft | literal-symbol | A smiling baby duck floating gently on calm water ripples. | 7 | Simple, charming duck; scales well |
| 33 | Storage Bar | gpt-image | lettermark | SB monogram shaped like stacked storage crates forming a cocktail glass. | 2 | Wood-grain illustration, unreadable |
| 34 | Storage Bar | recraft | literal-symbol | A cardboard storage box morphed into a smiling cocktail glass. | 3 | Box + glass, clunky and literal |
| 35 | Storage Bar | nano-banana | abstract-geometric | Interlocking cube and cylinder suggesting compact space and convivial gathering. | 4 | Doesn't say bar; grey with a frame |
| 36 | Storage Bar | gpt-image | negative-space | Stacked storage boxes form a cocktail glass, smile in negative space. | 3 | Box/glass mash with a smile |
| 37 | Storage Bar | recraft | negative-space | A storage box silhouette reveals a cocktail glass in negative space. | 6 | Glass in a box reads like a "fragile" label; clear |
| 38 | Brunk Automation | nano-banana | lettermark | BA monogram forming a precise interlocking mechanism or automated assembly joint. | 3 | Overwrought BA with a gear |
| 39 | Brunk Automation | gpt-image | abstract-geometric | Interlocking rectangular blocks form a precise, continuous automated cycle. | 6 | Solid interlocking cycle; generic |
| 40 | Brunk Automation | recraft | negative-space | Interlocking precision gears reveal a medical cross in negative space. | 1 | Reads as a swastika: brand risk |
| 41 | Brunk Automation | nano-banana | literal-symbol | Precision robotic arm in geometric, angular form. | 4 | Robot-arm clip art |
| 42 | Ligt | gpt-image | lettermark | L monogram shaped as an upward arrow tracking progressive strength gains. | 4 | Clumsy L-arrow |
| 43 | Tidepool | gpt-image | abstract-geometric | Two overlapping rounded shapes forming a gentle wave and smile. | 6 | Simple wave/smile |
| 44 | Ligt | gpt-image | literal-symbol | A friendly weight plate with a simple smiling face. | 2 | Clown-face weight plate |
| 45 | Ligt | recraft | negative-space | Barbell viewed from end; central weight plate reveals upward arrow. | 5 | Keyhole/arrow; reads as a user icon |
| 46 | Ligt | nano-banana | negative-space | Rising bar forms bracket, arrow emerges in negative space. | 4 | Odd glyph that looks like "h1" |
