# Example Pairs — plan

## Context

Lessons 2, 3, and 4 teach **derivations**: dual is derived from singular, feminine from masculine, present from past. Today the examples sections show flat chip lists — `فَاضِلَانِ، فَاضِلَيْنِ، فَاضِلَتَانِ، …` — which renders the *result* without showing the *transformation*. The learner has to mentally pair each derived form with its base.

This change adds an optional **pair-rendering** for examples: each row shows the base form on the right (RTL) and the derived form on the left, so the relationship is visible. Same chip styling, same theme tokens, just two columns linked by an arrow.

It's the smallest possible win that delivers on the "show, don't list" principle without going near animation engineering.

## Design

```
   مُفْرَدٌ                            مُثَنًّى
   ────────                          ────────
   فَاضِلٌ            ←              فَاضِلَانِ
   مُجْتَهِدٌ          ←              مُجْتَهِدَانِ
   كِتَابٌ            ←              كِتَابَانِ
```

Direction: in RTL the base column sits on the right (read first), derived on the left, with `←` between them. Arrow is a faint muted glyph — supporting, not loud. Column headers are optional; when omitted, just two stacked columns of chips.

Visual reuses what already exists: chips use `theme.chipBg` from `conceptThemes`, header labels use `type-body-lg font-bold text-label`, dividers use `border-divider`. No new tokens, no theme additions.

## Schema change

`types/lesson.ts` — add to `Concept`:

```ts
export interface ExamplePair {
  from: string;
  to: string;
}

export interface Concept {
  type: string;
  definition: string;
  examples: string[];                    // unchanged
  example_pairs?: ExamplePair[];         // NEW — optional
  pair_from_label?: string;              // NEW — optional column header
  pair_to_label?: string;                // NEW — optional column header (defaults to concept.type)
  group?: string;
  spot_the_word?: SpotTheWord;
}
```

Behavior:
- If `example_pairs` is present, `StepConcept` renders the pair layout *in place of* the flat list.
- If only `examples` is present, behavior is exactly what it is today.
- A concept can have either, not both. Authors choose per concept.

`pair_from_label` and `pair_to_label` are optional. If both missing → no headers, just chips with the arrow between them. If `pair_to_label` missing but `pair_from_label` present → derive `to` label from `concept.type`. Headers are always optional polish.

## Component change

`components/steps/StepConcept.tsx` — replace the existing examples block with a small switch:

```tsx
{concept.example_pairs ? (
  <ExamplePairsBlock concept={concept} theme={theme} />
) : (
  <FlatExamplesBlock examples={concept.examples} theme={theme} />
)}
```

`FlatExamplesBlock` is the current behavior, factored out. `ExamplePairsBlock` is new: a 2-column grid using CSS grid (`grid-cols-[1fr_auto_1fr]`) with the from-chip, an arrow span, and the to-chip per row. Optional headers as a header row above the chips.

Roughly 40–60 new lines. No new dependencies.

## Per-lesson application

### Lesson 4 — singular / dual / plural (highest payoff)

Four of the five concepts get pairs. The base for all is the singular (مُفْرَد).

| Concept | `pair_from_label` | `pair_to_label` (auto) | Example pairs |
|---------|-------------------|------------------------|---------------|
| مُفْرَدٌ | — | — | (no pairs — keep `examples` as today) |
| مُثَنًّى | مُفْرَدٌ | مُثَنًّى | فَاضِلٌ → فَاضِلَانِ، مُجْتَهِدٌ → مُجْتَهِدَانِ، كِتَابٌ → كِتَابَانِ، قَلَمٌ → قَلَمَانِ |
| جَمْعُ التَّكْسِيرِ | مُفْرَدٌ | جَمْعُ التَّكْسِيرِ | كِتَابٌ → كُتُبٌ، قَلَمٌ → أَقْلَامٌ، رَجُلٌ → رِجَالٌ، بَيْتٌ → بُيُوتٌ |
| جَمْعُ الْمُذَكَّرِ السَّالِمُ | مُفْرَدٌ | جَمْعُ الْمُذَكَّرِ السَّالِمُ | فَاضِلٌ → فَاضِلُونَ، مُجْتَهِدٌ → مُجْتَهِدُونَ، مُعَلِّمٌ → مُعَلِّمُونَ، مُسْلِمٌ → مُسْلِمُونَ |
| جَمْعُ الْمُؤَنَّثِ السَّالِمُ | مُفْرَدٌ | جَمْعُ الْمُؤَنَّثِ السَّالِمُ | فَاضِلَةٌ → فَاضِلَاتٌ، مُجْتَهِدَةٌ → مُجْتَهِدَاتٌ، طَالِبَةٌ → طَالِبَاتٌ، طَبِيبَةٌ → طَبِيبَاتٌ |

This is where pairs *really* shine — every "what is the rule for forming X" concept now visibly demonstrates the rule.

### Lesson 3 — masculine / feminine

One concept gets pairs.

| Concept | `pair_from_label` | `pair_to_label` (auto) | Example pairs |
|---------|-------------------|------------------------|---------------|
| الْمُذَكَّرُ | — | — | (no pairs — base form) |
| الْمُؤَنَّثُ | الْمُذَكَّرُ | الْمُؤَنَّثُ | مُؤْمِنٌ → مُؤْمِنَةٌ، فَاضِلٌ → فَاضِلَةٌ، مُعَلِّمٌ → مُعَلِّمَةٌ، طَبِيبٌ → طَبِيبَةٌ، طَالِبٌ → طَالِبَةٌ |

The "add ة" rule is *visible* the moment the columns line up.

### Lesson 2 — verb tenses (open question — discuss before implementing)

Lesson 2 has three concepts: الْفِعْلُ الْمَاضِي، الْفِعْلُ الْمُضَارِعُ، فِعْلُ الْأَمْرِ. None of these are strictly "derived from" the others in the way feminine derives from masculine. They're co-equal forms of the same root verb.

Three viable framings:

1. **Show all three forms across one root per row** (3 columns, not pairs). e.g. `كَتَبَ | يَكْتُبُ | اكْتُبْ`. Most informative but breaks the pair-only schema — would need a different render or a wider data shape.
2. **Pair against the past tense as the "base"** (Arabic morphological convention: maḍī is the base). For mudāriʿ concept: `كَتَبَ → يَكْتُبُ`. For amr concept: `كَتَبَ → اكْتُبْ`. Past concept stays flat.
3. **Skip lesson 2 for now**, ship lesson 3 + 4 first, decide on lesson 2 after seeing how it lands.

I'd recommend option 3 followed by option 1 in a future iteration — the 3-column "verb across all forms" is the *correct* visual for tense, and it's worth a small follow-up to support multi-form rows rather than forcing tenses into 2-column pairs.

**Need your call before implementing lesson 2.**

## Files to modify

- `types/lesson.ts` — add `ExamplePair` and three optional Concept fields.
- `components/steps/StepConcept.tsx` — split examples block into `FlatExamplesBlock` + `ExamplePairsBlock`, conditional render.
- `data/lesson_4.json` — add `example_pairs` + labels to the 4 derived concepts.
- `data/lesson_3.json` — add `example_pairs` + labels to the الْمُؤَنَّثُ concept.
- `data/lesson_2.json` — pending decision.
- `data/AUTHORING.md` — new subsection under "Concepts" documenting `example_pairs` and when to use it.
- `data/LESSON_PROMPT.md` — one-line mention so AI authors know it exists.

## Effort

Half a day for lesson 4 + lesson 3, including all schema, component, content, and doc work. Lesson 2 adds an extra ~half day if we go option 1 (multi-form rows) since it needs a different render path.

## Verification

1. `npx next build` — confirms TS schema is consistent.
2. Open lesson 4 in the dev server. Walk through every concept:
   - مُفْرَدٌ — should still show flat chips (no pairs).
   - مُثَنًّى → جَمْعُ المُؤَنَّثِ السَّالِمُ — should show 2-column pairs with column headers, arrow between.
3. Open lesson 3 → الْمُؤَنَّثُ — verify pair layout. الْمُذَكَّرُ should still be flat.
4. Lesson 1 — should be visually identical to today (no pairs anywhere).
5. Tashkeel sweep on every new pair value.
6. Phone-width screen — confirm long Arabic words don't overflow column widths. If they do, fall back to a stacked layout (from on top, arrow ↓, to below) at narrow viewports.

## What this is NOT

- Not animation. Pairs are static — the relationship is communicated by *position*, not motion. Animation can layer on top later (a `<MorphableWord>` primitive could replace the static `to` chip in a future revision).
- Not a new step type. Concepts still have one definition + one examples block — the examples block just gets a richer rendering when the data warrants.
- Not a redesign of the lesson flow. Same screens, same nav, same exercise types.
