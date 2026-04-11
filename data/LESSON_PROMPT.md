# Lesson Authoring Prompt

Copy everything below the line into a new agent chat. Fill in the placeholders before sending.

---

## Prompt

I need you to create a new lesson for my Arabic grammar (nahw) learning app.

**Read these files first** (do not skip this):
- `data/AUTHORING.md` — the authoring guide with JSON schema, content guidelines, tashkeel rules, and exercise conversion rules. Follow it exactly.
- `data/lesson_1.json` — the gold-standard reference for what a finished lesson looks like. Match this format and quality.
- `types/lesson.ts` — the TypeScript types your JSON must conform to.
- `data/omitted_content.yaml` — see the pattern for logging omitted content.

**Lesson details:**
- Lesson number: <!-- e.g. 2 -->
- Module ID: <!-- e.g. 02_aqsaam_al_fil -->
- Source text is below.

**What I need you to do:**
1. Read the source text and the authoring guide thoroughly.
2. Draft a complete `lesson_N.json` following the guide. This means:
   - A one-sentence introduction hook
   - Concepts with definitions, examples, and a quick check each
   - A review quiz (2-4 MCQs converted from the textbook exercises)
   - A word sort exercise (from the classification exercise, or create one if none exists)
3. Flag any suspected OCR/tashkeel errors you notice in the source.
4. Flag any content decisions you're unsure about — do NOT silently force content that doesn't fit.
5. Log anything you deliberately omit in the omitted_content.yaml format (don't write the file, just show me what to add).
6. Add the import to `data/index.ts`.
7. Run `npx next build` to verify there are no type errors.
8. Tell me it's ready for review on my phone.

**If the lesson doesn't fit the standard format** (e.g. no clear concepts, exercises that don't convert, needs a new step type), stop and tell me what's different before drafting anything.

**Source text for this lesson:**

```
<!-- Paste the OCR markdown for this lesson here -->
```
