# Studio lockups: review of colored mark + wordmark slides (2026-10-13)

Rendered all 61 marks in R2 (47 emulator marks from the 2026-10-12 review plus the newer
emulator and production ones) through the real `LockupSlide` in both the horizontal and stacked
layouts, each in a brand font and a library palette. Measured each mark's trimmed aspect ratio
and ink density with sharp to ground the sizing changes.

Measured range: aspect 0.09 to 3.14, density 0.13 (a thin ring) to 0.92 (a solid blob).

## Issues found

| # | Issue | Examples | Cause |
|---|---|---|---|
| 1 | Wide, thin marks come out as a smudge beside the name | Synthetic Clothes cheetah (3.1:1, density 0.24), Neels AI node chain, Ligt bars | `lockupLayout` floored wide marks at 1.1 cap heights and capped width at 4.5; the sparse boost topped out at 15% although density goes down to 0.13 |
| 2 | Long names shrink the whole lockup and the mark becomes a dot | Quiet Art Movement, Synthetic Clothes, Brunk Automation, Cafe Chauciao | The row is fitted to 70% of the slide width; the name dominates the row, and the mark was sized only in cap heights, so it shrank with the text |
| 3 | Outline and monoline marks look faint at lockup size even when the geometry is good | cheetah, three-spoke wheel, thin rings | Image prompt only asked for "consistent stroke weights"; the monoline recipe asked for ~8% strokes, and the vision check had no flag for thin strokes |
| 4 | Lettermarks repeat the first letters of the wordmark (TP + Tidepool, FD + Fever Dream, BA + Brunk Automation, L + Ligt) | Tidepool #16, Fever Dream #27, Brunk #38, Ligt #44 | Concept prompt treats lettermarks like any other idea type; next to the full name a monogram is redundant |
| 5 | Vector-slide SVGs in the mark pipeline never render (slide stays hidden) | two `.svg` objects in R2 | Not a production path (vector output is stored as `svgUrl`), but `useTrimmedMark` has no failure state, so a bad URL hides the slide forever |
| 6 | Mascot and clip-art marks (smiley dumbbell, clown weight plate) are the weakest in lockups, as in the single-mark review | Ligt #9, #44, #46 | Already addressed by the 2026-10-12 concept changes; the newer batch has none |

## Changes made

- `lockupLayout`: sparse boost up to 40% (`sparseBoost`), wide-mark floor 1.3 cap heights, width cap 5.5,
  and a `nameBoost` of up to 30% for names past 8 characters so the mark keeps presence beside a long word.
  Height cap raised from 2.4 to 2.8 to make room for the boosts. `stackedLayout` shares `sparseBoost`.
- `LockupSlide` horizontal fit widened from 70% to 78% of the slide.
- `LOGO_STYLE_RULE`: strokes, gaps and cut-outs no thinner than a tenth of the mark width.
- Monoline recipe: stroke 10-12% of the mark width (was ~8%).
- `mark-qa`: new `tooThin` flag, fed into the one re-render like the other flags.

## Not changed (worth a follow-up)

- Issue 4: give lettermarks a lower prior when the brand name is short, or render them in the
  mark-only layout by default.
- Issue 5: `useTrimmedMark` should surface load failures so the slide can show an error state.
- Long names would be better served by starting on the stacked layout instead of horizontal.
