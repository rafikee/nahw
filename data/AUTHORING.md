# Lesson Authoring Guide

Reference for creating new lessons in this app. Follow this when converting source-book content into `lesson_N.json` files.

## Process

### Step 1: Provide the source text

Drop the OCR'd markdown for one lesson into the conversation. The AI will use it as input.

### Step 2: AI drafts the lesson JSON

The AI reads the source, maps it to our JSON structure, and produces a complete `lesson_N.json`. During this step the AI will:

- Write the introduction hook (1 sentence)
- Extract concepts with definitions and examples
- Write a quick check question per concept
- Convert suitable textbook exercises into review quiz MCQs
- Build a word sort exercise from the classification exercise (if one exists)
- Flag suspected OCR/tashkeel errors
- Flag content decisions it's unsure about (e.g. should two short sections be merged into one lesson?)

**Important: stop and escalate if the lesson doesn't fit.** If the source material doesn't map cleanly to our JSON structure -- for example, a lesson has no clear "concepts" to extract, or the exercises don't convert to quick checks or word sorts without heavy rewriting, or the lesson seems to need a new step type we don't have -- **do not force it**. Instead, stop and tell the human: "This lesson doesn't fit the current format well. Here's what's different: [specifics]. We should discuss how to handle it before I draft the JSON." It's always better to pause and adapt the format than to silently produce a lesson that feels wrong.

### Step 3: Wire it up

Add the new file to `data/index.ts`:

```ts
import lesson2Data from "./lesson_2.json";
// ...
export const LESSONS = [lesson1Data, lesson2Data] as unknown as Lesson[];
```

### Step 4: Review in the app

Open the lesson on your phone. Read every screen. Check for:

- Tashkeel errors (see checklist below)
- Incorrect grammar type labels
- Bad quick check distractors (too obvious or misleading)
- Explanations that don't actually explain
- Word sort words that are ambiguous

### Step 5: Fix and commit

Feed corrections back to the AI, or edit the JSON directly. Once it looks right, commit.

### Step 6: Log omitted content

Anything from the source text that was deliberately left out goes into `data/omitted_content.yaml` with a reason.

---

## JSON Schema Reference

Each lesson lives in `data/lesson_N.json`. The TypeScript types are in `types/lesson.ts`.

### Top level

```json
{
  "module_id": "02_aqsaam_al_fil",
  "title": "أَقْسَامُ الْفِعْلِ",
  "introduction": "...",
  "concepts": [...],
  "exercises": { "review_quiz": [...], "word_sort": {...} }
}
```

| Field | Type | Guidelines |
|-------|------|-----------|
| `module_id` | string | Lowercase transliteration, numbered prefix: `01_`, `02_`, etc. |
| `title` | string | The lesson title with full tashkeel. Taken from the source heading. |
| `introduction` | string | **One sentence** that hooks the learner. States the key takeaway. No multi-paragraph prose. Supports `**bold**` syntax. |

### Concepts

Each concept has a definition, examples, and an inline quick check.

```json
{
  "type": "الْفِعْلُ الْمَاضِي",
  "definition": "مَا دَلَّ عَلَى حُصُولِ شَيْءٍ فِي زَمَنٍ قَدْ مَضَى وَانْتَهَى.",
  "examples": ["كَتَبَ", "فَتَحَ", "شَرِبَ"],
  "quick_check": { ... }
}
```

| Field | Guidelines |
|-------|-----------|
| `type` | The concept name as displayed in the badge. Full tashkeel. Keep it short (1-3 words). |
| `definition` | One or two sentences from the source text. Supports `**bold**` for key terms. Aim for the إيضاح (explanation) version, not the terse rule statement. |
| `examples` | 5-12 words. All with full tashkeel. Prefer variety (different verb patterns, different noun types, etc.). |

### Quick Check

Appears after each concept and also in the review quiz. MCQ format.

```json
{
  "question": "أَيُّ هَذِهِ الْأَفْعَالِ فِعْلٌ مَاضٍ؟",
  "options": [
    { "text": "يَفْهَمُ", "correct": false },
    { "text": "شَرِبَ", "correct": true },
    { "text": "اجْلِسْ", "correct": false },
    { "text": "نَسْمَعُ", "correct": false }
  ],
  "explanation": "«شَرِبَ» فِعْلٌ مَاضٍ لِأَنَّهُ يَدُلُّ عَلَى أَنَّ الشُّرْبَ قَدْ حَصَلَ فِي زَمَنٍ مَضَى وَانْتَهَى."
}
```

| Field | Guidelines |
|-------|-----------|
| `question` | Full tashkeel. Should test understanding of the concept, not just recognition. |
| `options` | 3-4 options. Exactly one `correct: true`. Distractors should be plausible (other grammar types from the lesson, not random words). |
| `explanation` | Explains **why** the answer is correct. References the definition. 1-2 sentences. |

**Writing good distractors:**
- Use words that belong to the other concepts taught in the same lesson
- Avoid distractors that are obviously wrong to someone who hasn't studied the material
- For "why is X a Y?" questions, make distractors that describe the other types accurately

### Word Sort

The classification exercise at the end of the lesson.

```json
{
  "instruction": "صَنِّفِ الْكَلِمَاتِ التَّالِيَةَ حَسَبَ نَوْعِهَا:",
  "categories": [
    { "key": "فعل", "label": "فِعْلٌ" },
    { "key": "اسم", "label": "اسْمٌ" }
  ],
  "words": [
    { "word": "كَتَبَ", "category": "فعل" }
  ]
}
```

| Field | Guidelines |
|-------|-----------|
| `categories` | `key` is the internal identifier (no tashkeel). `label` is what the user sees (full tashkeel). Usually matches the concept types from the lesson. |
| `words` | 10-15 words. Each `category` must match a `key` from `categories`. Aim for roughly equal distribution across categories. All words with full tashkeel. |
| `instruction` | Full tashkeel. Usually a variation of "classify these words by type." |

**Sourcing word sort data:**
- The textbook's "عيِّنِ..." (classify...) exercises are the primary source
- If the textbook doesn't have a classification exercise, create one using examples from the concepts plus a few new words

### Review Quiz

The review quiz sits between the per-concept quick checks and the word sort. It tests comprehension of the lesson as a whole.

```json
"review_quiz": [
  {
    "question": "...",
    "options": [...],
    "explanation": "..."
  }
]
```

**Sourcing review quiz questions:**
- Convert the textbook's factual/short-answer questions (ما الذي...، إلى كم...، بماذا...) into MCQ format
- Drop pure recall questions ("name 10 verbs") -- they don't work as MCQs
- Aim for 2-4 questions per lesson

---

## Exercise Conversion Rules

The textbook has several exercise patterns. Here's how to handle each:

| Textbook pattern | Example | App conversion |
|-----------------|---------|---------------|
| Factual question with short answer | "إلى كم قسم ينقسم الفعل؟" | Convert to **review quiz MCQ** |
| "Name N examples of X" | "اذكر عشرة أفعال" | **Drop** (pure recall, log in omitted_content.yaml) |
| "Classify these words" | "عيّن الأفعال والأسماء..." with word list | Convert to **word sort** |
| "Classify words in this passage" | "عيّن ما يظهر لك... في هذه العبارة" | **Drop** for now (log in omitted_content.yaml) |
| "How many words in each sentence?" | "كم كلمة في كل جملة..." | Convert to **review quiz MCQ** if feasible, otherwise drop |
| "Identify X and Y in these sentences" | "عيّن المفرد والمثنى وأنواع الجمع..." | Convert to **word sort** if it's word-level, otherwise drop |

---

## Tashkeel Checklist

All content text (definitions, examples, questions, explanations, instructions) must have full tashkeel. Common OCR errors to watch for:

### Missing or wrong harakat
- Shadda (ّ) is frequently dropped by OCR, especially on common words: الشَّمْسُ not الشمسُ
- Tanween is often missing: كِتَابًا not كِتَابا
- Sukoon (ْ) is frequently confused with nothing: اكْتُبْ not اكتب
- Fatha/kasra/damma swaps are common on less-familiar words

### Common letter OCR errors
- ح/خ and ج/ح confusion
- ذ/د confusion
- ة/ه confusion at end of words
- و at the start of words sometimes dropped

### How to spot errors
- Read the text aloud. If a word sounds wrong, the tashkeel is probably wrong.
- Compare against the PDF source when in doubt -- the OCR markdown is a lossy copy.
- Pay special attention to verb conjugations: wrong tashkeel changes the meaning entirely.

### UI chrome tashkeel
All button labels, breadcrumb text, section headings, and feedback messages in the app must also have full tashkeel. This is handled in the components, not in the JSON. If adding a new step type or label, follow the existing pattern.

---

## Theme System

The app now uses semantic theme tokens for runtime colors. If a future change touches app UI, do not introduce hard-coded Tailwind color names like `bg-red-50`, `text-white`, `bg-black/20`, or raw hex values in components.

### Use theme tokens instead

Prefer the shared classes defined in `app/globals.css`, including:

- Core lesson/app colors: `primary`, `primary-hover`, `primary-soft`, `primary-border`, `primary-text`
- Surfaces and text: `page`, `page-outer`, `surface`, `surface-hover`, `elevated`, `elevated-strong`, `elevated-muted`
- Structure: `divider`, `divider-strong`, `track`
- Text roles: `heading`, `body`, `label`, `muted`, `faint`
- Strong contrast text: `on-primary`, `on-dark`
- Feedback states: `success`, `success-soft`, `success-border`, `success-text`, `danger`, `danger-soft`, `danger-border`, `danger-text`
- Overlays and highlights: `overlay`, `highlight`, `highlight-text`

These are available through the utility-style classes already used in the app, for example:

- `bg-primary`, `hover:bg-primary-hover`
- `text-heading`, `text-muted`
- `border-divider-strong`
- `bg-success-soft`, `text-success-text`
- `bg-overlay`

### Exceptions

- Theme preview swatches in the settings picker may use direct per-theme color values, because they need to show multiple themes at once.
- The palette definitions in `app/globals.css` are the source of truth, so hard-coded color values belong there, not in app components.

### Authoring implication

Most lesson authoring stays in JSON and does not require color decisions. But if a new step type, badge, feedback state, or piece of app chrome is added while wiring lessons into the UI, it should use the semantic theme vocabulary above instead of inventing new one-off colors.

---

## Typography System

The app uses a small set of semantic type roles defined in `app/globals.css`. Do not use ad hoc Tailwind size classes like `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc., or inline `lineHeight` / `leading-[…]` values in components. Use the type roles instead.

### Type roles

| Role | Size | Line-height | When to use |
|------|------|-------------|-------------|
| `type-display` | 2.25rem (36px) | 1.5 | Splash/course hero title only |
| `type-title` | 1.5rem (24px) | 1.8 | All step headings, sheet titles, concept names |
| `type-body-lg` | 1.125rem (18px) | 2.2 | Lesson definitions, quiz options, example chips, key explanatory copy |
| `type-body` | 1rem (16px) | 2.2 | Standard body text, section labels, badges, chips, breadcrumb, buttons, feedback copy — this is the smallest allowed size |
| `type-compact` | 1rem (16px) | 1.4 | Same as `type-body` but with tight line-height for space-constrained controls like footer nav buttons |

### Rules

- **No text smaller than 16px.** `type-body` (1rem) is the floor. There is no 14px tier. Arabic script with diacritics needs this minimum to stay readable.
- **Font weight stays separate.** The type roles set size and line-height only. Add `font-bold`, `font-semibold`, etc. alongside the role class as needed.
- **Line-height comes from the role.** Do not add `leading-*` or inline `lineHeight` overrides. If a new control genuinely needs a different rhythm, add a role variant (like `type-compact`) in `app/globals.css` instead of a one-off value.
- **Body baseline.** The `body` element uses 1rem / 2.2 line-height, so unstyled text inherits a comfortable Arabic reading size.

### Examples

```html
<h1 class="type-title font-bold text-heading">…</h1>
<p class="type-body-lg text-body">…</p>
<span class="type-body font-semibold text-muted">…</span>
<button class="type-compact font-bold text-on-primary">…</button>
```

### Authoring implication

Lesson content lives in JSON and does not set font sizes. But if a new step type, card, or piece of app chrome is added while wiring lessons into the UI, it must use these type roles instead of inventing new size classes.

---

## Content Guidelines

### Introduction hook
- One sentence. States the core idea of the lesson.
- Example: "كُلُّ كَلِمَةٍ فِي الْعَرَبِيَّةِ تَنْتَمِي إِلَى نَوْعٍ وَاحِدٍ مِنْ **ثَلَاثَةِ أَنْوَاعٍ** فَقَطْ"
- Do NOT include "in this lesson we'll learn..." -- that's implied by opening the lesson.

### Definitions
- Prefer the إيضاح (explanation) text over the terse rule. The explanation is more learner-friendly.
- Use `**bold**` for the key terms that define the concept.

### Examples
- Variety matters more than quantity. 6 good examples beat 12 repetitive ones.
- For verb examples, include different patterns (3-letter, 4-letter roots) and different tenses if relevant.
- For noun examples, mix people, animals, plants, objects.

### What to omit
- Verbose preamble text ("as we learned before...", "you already know that...")
- Word-length trivia (how many letters in a word)
- Passages intended for oral recitation
- Log everything omitted in `data/omitted_content.yaml`

### Lessons with sub-topics
Some textbook sections are closely related (e.g. singular/dual/plural and plural subtypes). Use judgment:
- If they build on each other and share the same exercise set, **merge** into one lesson
- If each has its own exercises and distinct concepts, keep as **separate** lessons
- When in doubt, keep separate -- shorter lessons are better than long ones

---

## Adding the Lesson to the App

After creating `data/lesson_N.json`:

1. Import it in `data/index.ts` and add to the `LESSONS` array
2. No other code changes needed -- the app dynamically builds views from the `LESSONS` array
3. Run `npx next build` to verify there are no type errors
4. Test on your phone
