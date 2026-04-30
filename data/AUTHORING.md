# Lesson Authoring Guide

Reference for creating new lessons in this app. Follow this when converting source-book content into `lesson_N.json` files.

The lesson format may evolve over time. When in doubt, treat `types/lesson.ts` as the source of truth for the current schema and the existing `lesson_*.json` files as the reference for content quality.

## Project Structure

The app is organized around a **Level → Lesson → Step** hierarchy. ("Level" = الْمُسْتَوَى in the UI; called `Level` / `LEVELS` / `LevelMeta` in the code. Earlier versions called these "books" — the rename is purely cosmetic.)

```
data/
  course.ts            ← Course manifest: defines levels and which lessons belong to each
  index.ts             ← Imports all lesson JSON files, exports LESSONS array
  lesson_1.json        ← Lesson content (one file per lesson)
  lesson_2.json
  omitted_content.yaml ← Log of source-book content deliberately left out, with reasons
  course_intro.json    ← Reference artifact (intro prose from the source book, not loaded by the app)
  AUTHORING.md         ← This file
  LESSON_PROMPT.md     ← Copy-paste prompt for starting a new lesson with an AI agent

source-content/
  nahw-book-13-25.md   ← OCR'd source text from the textbook (pages 13-25)

types/
  lesson.ts            ← TypeScript types for Lesson, Concept, QuickCheck, WordSortExercise

components/
  screens/
    HomeScreen.tsx     ← Level/lesson browser (the landing page)
    LessonPlayer.tsx   ← Step-by-step lesson flow (header, progress bar, footer nav)
    LessonComplete.tsx ← End-of-lesson screen with "next lesson" transition
  steps/
    StepLessonIntro.tsx   ← Lesson title + introduction + concept preview grid
    StepConcept.tsx       ← Single concept: name, definition, examples
    StepQuickCheck.tsx    ← MCQ (used for per-concept checks and review quiz)
    StepWordSort.tsx      ← Tap-to-classify word sorting exercise
  ui/
    RichText.tsx       ← Renders **bold** markup in lesson text strings

app/
  page.tsx             ← Root: manages screen navigation (home / lesson / lesson_complete)
  layout.tsx           ← HTML shell, font loading, theme bootstrap
  globals.css          ← Theme palettes, typography roles, animations
```

### Navigation model

The app uses a client-side state machine with three screens:

- **Home** (`HomeScreen`) — shows all levels with their lessons listed. Tapping a lesson starts it.
- **Lesson** (`LessonPlayer`) — walks through a single lesson's steps: intro → (concept → quick check) × N → review quiz → word sort. Footer "next" on the last step triggers the completion screen.
- **Lesson complete** (`LessonComplete`) — congratulations and a "next lesson" button that auto-resolves the next lesson (even across level boundaries).

### Level/lesson hierarchy

The course manifest lives in `data/course.ts`. It defines `LEVELS` — an array of `LevelMeta` objects, each listing the `module_id` values of its lessons in order. Lesson JSON files do not know which level they belong to; that mapping is only in the manifest.

```ts
// data/course.ts (simplified)
export const LEVELS: LevelMeta[] = [
  {
    id: "level-1",
    subtitle: "أَسَاسِيَّاتُ النَّحْوِ",
    lessonIds: ["01_anwaa_al_kalimat", "02_aqsaam_al_fil"],
  },
  // future levels go here
];
```

`LevelMeta` fields:
- `id` — slug like `"level-1"`, `"level-2"`. Internal only; never user-facing.
- `subtitle` — what the user sees on the home screen and in the lesson breadcrumb. Full tashkeel.
- `lessonIds` — ordered `module_id` values. Order determines display order and the "next lesson" sequence.

The user-facing ordinal label ("الْمُسْتَوَى الْأَوَّلُ", "الْمُسْتَوَى الثَّانِي") is derived in `HomeScreen.tsx` from the level's index — there is no `title` field on `LevelMeta`.

Adding a new lesson means: (1) create the JSON, (2) import it in `data/index.ts`, (3) add its `module_id` to the right level's `lessonIds` in `data/course.ts`. See "Adding the Lesson to the App" at the bottom for the full checklist.

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

Two files need updating:

**`data/index.ts`** — import the JSON and add it to the `LESSONS` array:

```ts
import lesson3Data from "./lesson_3.json";
// ...
export const LESSONS = [lesson1Data, lesson2Data, lesson3Data] as unknown as Lesson[];
```

**`data/course.ts`** — add the lesson's `module_id` to the correct level's `lessonIds` array:

```ts
export const LEVELS: LevelMeta[] = [
  {
    id: "level-1",
    // ...
    lessonIds: ["01_anwaa_al_kalimat", "02_aqsaam_al_fil", "03_new_lesson"],
  },
];
```

The order in `lessonIds` determines the order lessons appear in the app and the "next lesson" flow.

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

## Theme and Typography

Lesson authoring is JSON-only and does not require color or font-size decisions. The app uses semantic theme tokens (colors) and type roles (sizes/line-heights) defined in `app/globals.css`. If a new step type or UI element is added while wiring a lesson into the app, use the existing tokens and roles from `globals.css` and follow the patterns in the existing step components -- do not introduce hard-coded Tailwind color classes, raw hex values, or ad-hoc size classes.

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
2. Add its `module_id` to the correct level's `lessonIds` array in `data/course.ts`
3. Run `npx next build` to verify there are no type errors
4. Test on your phone — the lesson should appear in the home screen under its level, and the "next lesson" button on the previous lesson's completion screen should link to it

### Adding a new level

If the lesson belongs to a new level (not yet in `data/course.ts`):

1. Add a new `LevelMeta` entry to the `LEVELS` array in `data/course.ts`
2. Use a sequential `id` like `"level-2"`, `"level-3"`, etc.
3. Set `subtitle` (the level's topic, with tashkeel). The user-facing ordinal ("الْمُسْتَوَى الثَّانِي") is derived from index — no `title` field.
4. List the level's lesson `module_id` values in `lessonIds`
5. The home screen and next-lesson navigation automatically pick up the new level — no component changes needed
