# Lesson Authoring Prompt

Copy everything below the line into a new agent chat. Fill in the placeholders before sending.

---

## Prompt

I need you to create a new lesson for my Arabic grammar (nahw) learning app.

**Read these files first** (do not skip this):
- `data/AUTHORING.md` — the authoring guide with project structure, JSON schema, content guidelines, tashkeel rules, and exercise conversion rules. Follow it exactly.
- `data/course.ts` — the course manifest that defines which levels exist and which lessons belong to each. You'll add the new lesson's `module_id` here.
- The existing `data/lesson_*.json` files — reference for what a finished lesson looks like. Match this format and quality.
- `types/lesson.ts` — the TypeScript types your JSON must conform to. This is the source of truth for the schema.
- `data/omitted_content.yaml` — see the pattern for logging omitted content.

**Lesson details:**
- Lesson number: <!-- e.g. 3 -->
- Module ID: <!-- e.g. 03_al_faail -->
- Level: <!-- e.g. level-1 (see data/course.ts for existing levels) -->
- Source text is below (existing OCR'd source material lives in `source-content/`).

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
6. Add the import to `data/index.ts` and add to the `LESSONS` array.
7. Add the lesson's `module_id` to the correct level's `lessonIds` in `data/course.ts`.
8. Run `npx next build` to verify there are no type errors.
9. Tell me it's ready for review on my phone.

**If the lesson doesn't fit the standard format** (e.g. no clear concepts, exercises that don't convert, needs a new step type), stop and tell me what's different before drafting anything.

**Source text for this lesson:**

```
<!-- Paste the OCR markdown for this lesson here -->
```
