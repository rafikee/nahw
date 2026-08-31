---
name: lesson
description: Author the next lesson(s) for the nahw Arabic grammar app — pick the next slice of the source book, draft the lesson JSON, validate it mechanically, get it reviewed by Gemini, QA it in a real browser, and publish. Use when the user types /lesson, or says things like "add the next lesson", "do the next few lessons", "keep going through the book", "build lesson 5". Defaults to a batch of three.
---

# lesson — the next slice of the book becomes a lesson

One pass produces a finished, reviewed, QA'd lesson and leaves the repo in a
publishable state. The default batch is **three lessons**; the user says when to
run the next batch.

`data/AUTHORING.md` is the content contract — schema, exercise conversion rules,
tashkeel rules, content guidelines. Read it before drafting. This file is the
*process*; that file is the *standard*.

## The loop, per lesson

### 1. Pick the slice

```bash
node scripts/coverage.mjs          # full picture
node scripts/coverage.mjs --next   # the next unclaimed section
```

The ledger names the next unclaimed section in declared reading order. It does
**not** decide the slice — you do. Judge against these, in order:

- **Bite-sized wins.** A lesson is 2–5 concepts. If a section carries more, split
  it. If two adjacent sections are each one thin concept and share an exercise
  set, merge them.
- **Cut the repetition — this gets more important, not less.** The book restates
  itself constantly, and later volumes revisit earlier material at greater depth.
  Before drafting, read the `concepts[].type` of every existing lesson and drop
  anything the course already teaches. Whole sections will eventually be worth
  skipping outright; record those in `data/coverage.json` with a `note` saying
  which lesson already covers them, so the section is never re-proposed.

  The exception is a genuine refresher: material worth restating because the new
  lesson depends on it. Keep that deliberately short and never as a full concept
  screen — a sentence in the introduction, not a re-teach. `review-flow.mjs`
  checks this and will flag `already_taught_earlier`.
- **Drop the noise.** Verbose preamble, oral-recitation passages, and word-length
  trivia do not become lessons. They become entries in
  `data/omitted_content.yaml` with a reason.

If the section genuinely does not fit the format — no extractable concepts, or
exercises that need a step type that does not exist — **stop and say so** rather
than forcing it. Adding a step type is a real conversation, not a silent choice.

### 2. Draft

Write `data/lesson_N.json` per `data/AUTHORING.md`. Use `example_pairs` for
concepts that teach a derivation. Flag any suspected OCR error in the source
rather than silently "fixing" it.

**Keep the sorting exercise short — 5 to 8 entries.** Four or five taps prove the
learner has the rule; beyond that it tests patience. The validator enforces the
range.

**Choosing the exercise.** The app has three shapes today: the MCQ quick check,
the review quiz, and the tap-to-sort. Pick what actually tests the concept rather
than defaulting to all three. If a concept teaches a derivation, `example_pairs`
on the concept screen may do more than another MCQ.

**Stop and ask before inventing a new exercise type.** A new step type is a
product decision, a schema change, and a new component — never a silent one. Say
what the existing shapes cannot test and what you would add, and wait.

### 3. Validate mechanically

```bash
npm run validate -- lesson_5
```

Proves schema shape, referential integrity, bold-markup balance, and tashkeel
*coverage*. Errors block; warnings are judgment calls. Word-final bare
consonants are reported as `pausal` warnings and are usually fine — they are
correct when citing a form in isolation, as in «كِتَاب».

Fix every error before moving on. Do not ask Gemini to find things this catches.

### 4. Second-model review

```bash
node scripts/gemini-review.mjs data/lesson_5.json --source source-content/<file>.md
```

Gemini judges what the validator cannot: whether each haraka is the *right*
haraka, whether definitions match the classical rule, whether the option marked
correct actually is, and whether distractors teach anything. Pass `--source` so
it can also check fidelity to the book.

The key is on a free tier: every Pro model reports a quota of 0 and the Flash
models throw transient 503s under load. The script walks a chain of three Flash
models with backoff, so a first-attempt failure is normal and not a reason to
stop — let it retry. `--list-models` shows what the key can actually reach.

The reviewer has been calibrated: four errors planted in lesson 1 (a flipped
answer key, a miscategorised word-sort entry, a wrong haraka, and a relative
pronoun that disagreed with its head) were all four caught, correctly diagnosed,
and correctly fixed. Re-run that check if the model chain changes.

Apply every `critical` and `major` finding. For `minor` ones, use judgment.
**Do not apply a correction you believe is wrong** — Gemini is a reviewer, not
an authority. If you disagree, say so in your report to the user with both
readings rather than silently picking one.

Re-run steps 3 and 4 until the validator is error-free and the verdict is
`publish`.

### 4b. Structural review

```bash
node scripts/review-flow.mjs data/lesson_5.json
```

A second reviewer with a different job: not whether the Arabic is right, but
whether the lesson *teaches* well. It sees the lesson as the numbered screens the
learner walks, plus a digest of every earlier lesson, and judges redundancy
within the lesson, material already taught earlier, terms shown before anything
explains them, overloaded screens, wrong ordering, and exercises that do not test
what preceded them.

Keep it honest: if you change what the player renders, update `renderSteps` to
match. A reviewer looking at a screen the learner never sees produces confident
findings about nothing.

Aim for a `ship` verdict. `revise` with only minor findings is a judgement call —
say what you decided and why in your report rather than silently accepting it.

### 5. Wire it up

```bash
npm run gen:lessons     # regenerates data/index.ts
```

Then add the lesson's `module_id` to the right level's `lessonIds` in
`data/course.ts`. That file is hand-maintained on purpose — which level a lesson
belongs to is a curriculum decision, not a filesystem fact.

### 6. Build and QA in the browser

```bash
npm run build
npm run qa:lesson -- <module_id>
```

The QA driver walks every step in a real mobile viewport, answers each quick
check, and screenshots into `.qa/<module_id>/`. It fails on console errors, page
errors, horizontal overflow, and clipped text.

**A clean exit code is not the QA.** Read the screenshots. The driver cannot see
a definition that wraps badly, a distractor that gives the answer away by being
visibly longer, or tashkeel that renders wrong in the actual font.

For "is this screen overloaded?", measure rather than eyeball it — compare
`main.scrollHeight` against `main.clientHeight`. A screen around 100–150% of the
viewport is normal; well past that means it is carrying too much. Measure an
existing lesson alongside the new one rather than judging the number cold.

### 7. Record the decisions

- Add a claim per source heading consumed to `data/coverage.json`, with a `note`
  whenever the slice merged, split, or skipped something. Re-run
  `node scripts/coverage.mjs` and confirm the section flips to `✓`.
- Add anything deliberately cut to `data/omitted_content.yaml` with a reason.

## Publishing

`git push` to `main` **is** the production deploy to https://nahw.barada.dev.
Commit the batch, then push once, at the end — not per lesson.

After pushing:

```bash
~/.claude/skills/newapp/scripts/watch-deploy.sh nahw
~/.claude/skills/newapp/scripts/verify-app.sh nahw u8km6isr7bcfonf4xdfuz8rr 3000
```

Do not stop at a 200 — see `CLAUDE.md` for why both of those lie on a redeploy.

## Reporting back

Per lesson, tell the user: which source section it came from and why that slice,
what was cut and why, what Gemini flagged and what you did about it, and
anything you want a human eye on. Keep it short. Lead with anything you are
unsure about rather than burying it.
