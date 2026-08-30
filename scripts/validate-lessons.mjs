#!/usr/bin/env node
/**
 * Deterministic lesson validation.
 *
 * This covers everything about a lesson that can be proven mechanically —
 * schema shape, referential integrity, and tashkeel coverage. It deliberately
 * says nothing about whether the Arabic is *correct*; that is the reviewing
 * model's job, and the two checks are kept apart so neither is asked to do
 * work it is bad at.
 *
 * Usage:
 *   node scripts/validate-lessons.mjs            # all lessons
 *   node scripts/validate-lessons.mjs lesson_5   # one lesson
 *   node scripts/validate-lessons.mjs --json     # machine-readable
 *
 * Exit code is 1 if any `error` was found; `warn` never fails the run.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findBareLetters, findLoneShadda, normalizeArabic } from "./lib/tashkeel.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

/** Keys whose values are internal identifiers, not display copy. */
const NON_DISPLAY_KEYS = new Set(["module_id", "key", "category", "group"]);

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const filter = args.find((a) => !a.startsWith("--"));

const findings = [];
const add = (file, path, severity, rule, message) =>
  findings.push({ file, path, severity, rule, message });

/* ── Collect display strings ─────────────────────────────────────────── */

function walkStrings(node, path, out) {
  if (typeof node === "string") {
    out.push([path, node]);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (NON_DISPLAY_KEYS.has(k)) continue;
      walkStrings(v, path ? `${path}.${k}` : k, out);
    }
  }
}

/* ── Structural checks ───────────────────────────────────────────────── */

function checkQuickCheck(file, path, qc) {
  if (!qc || typeof qc !== "object") {
    add(file, path, "error", "schema", "missing quick check object");
    return;
  }
  if (!qc.question?.trim()) add(file, path, "error", "schema", "empty question");
  if (!qc.explanation?.trim())
    add(file, path, "error", "schema", "empty explanation");

  const options = qc.options ?? [];
  if (options.length < 3 || options.length > 4) {
    add(file, `${path}.options`, "warn", "mcq-shape",
      `${options.length} options; the guide calls for 3-4`);
  }
  const correct = options.filter((o) => o.correct).length;
  if (correct !== 1) {
    add(file, `${path}.options`, "error", "mcq-shape",
      `${correct} options marked correct; exactly 1 required`);
  }
  // Normalised: two options differing only in mark order are duplicates.
  const texts = options.map((o) => normalizeArabic(o.text));
  const dupes = texts.filter((t, i) => texts.indexOf(t) !== i);
  if (dupes.length) {
    add(file, `${path}.options`, "error", "duplicate",
      `repeated option text: ${[...new Set(dupes)].join(", ")}`);
  }
  for (const o of options) {
    if (!o.text?.trim())
      add(file, `${path}.options`, "error", "schema", "empty option text");
  }
}

function checkLesson(file, doc, seenIds) {
  const id = doc.module_id;

  if (!id || !/^\d{2}_[a-z0-9_]+$/.test(id)) {
    add(file, "module_id", "error", "module-id",
      `"${id}" must look like 05_al_jumal_al_mufida`);
  }
  if (seenIds.has(id)) {
    add(file, "module_id", "error", "module-id",
      `duplicate module_id, also used by ${seenIds.get(id)}`);
  } else {
    seenIds.set(id, file);
  }

  const fileNum = file.match(/^lesson_(\d+)\.json$/)?.[1];
  const idNum = id?.match(/^(\d+)_/)?.[1];
  if (fileNum && idNum && Number(fileNum) !== Number(idNum)) {
    add(file, "module_id", "warn", "module-id",
      `numbered ${idNum} but the file is lesson_${fileNum}.json`);
  }

  if (!doc.title?.trim()) add(file, "title", "error", "schema", "missing title");
  if (!doc.introduction?.trim())
    add(file, "introduction", "error", "schema", "missing introduction");
  if (doc.introduction && /[.؟!]\s*\S/.test(doc.introduction.replace(/\.\.\./g, ""))) {
    add(file, "introduction", "warn", "intro-length",
      "reads as more than one sentence; the guide asks for a single hook");
  }

  const concepts = doc.concepts ?? [];
  if (!concepts.length)
    add(file, "concepts", "error", "schema", "lesson has no concepts");
  if (concepts.length > 6) {
    add(file, "concepts", "warn", "lesson-size",
      `${concepts.length} concepts; longer lessons hurt completion`);
  }

  concepts.forEach((c, i) => {
    const p = `concepts[${i}]`;
    if (!c.type?.trim()) add(file, p, "error", "schema", "concept has no type");
    if (!c.definition?.trim())
      add(file, p, "error", "schema", "concept has no definition");

    const examples = c.examples ?? [];
    if (examples.length < 4 || examples.length > 12) {
      add(file, `${p}.examples`, "warn", "example-count",
        `${examples.length} examples; the guide calls for 5-12`);
    }
    const norm = examples.map(normalizeArabic);
    const exDupes = norm.filter((e, j) => norm.indexOf(e) !== j);
    if (exDupes.length) {
      add(file, `${p}.examples`, "error", "duplicate",
        `repeated example: ${[...new Set(exDupes)].join(", ")}`);
    }

    if (c.example_pairs) {
      if (c.example_pairs.length < 4 || c.example_pairs.length > 6) {
        add(file, `${p}.example_pairs`, "warn", "pair-count",
          `${c.example_pairs.length} pairs; the guide calls for 4-6`);
      }
      c.example_pairs.forEach((pair, k) => {
        if (!pair.from?.trim() || !pair.to?.trim()) {
          add(file, `${p}.example_pairs[${k}]`, "error", "schema",
            "pair is missing from/to");
        }
        if (pair.from === pair.to) {
          add(file, `${p}.example_pairs[${k}]`, "error", "pair-identity",
            `from and to are identical (${pair.from}); the pair shows no derivation`);
        }
      });
    }

    checkQuickCheck(file, `${p}.quick_check`, c.quick_check);
  });

  const quiz = doc.exercises?.review_quiz ?? [];
  if (quiz.length < 2 || quiz.length > 4) {
    add(file, "exercises.review_quiz", "warn", "quiz-count",
      `${quiz.length} questions; the guide calls for 2-4`);
  }
  quiz.forEach((q, i) =>
    checkQuickCheck(file, `exercises.review_quiz[${i}]`, q)
  );

  const sort = doc.exercises?.word_sort;
  if (!sort) {
    add(file, "exercises.word_sort", "error", "schema", "missing word sort");
    return;
  }
  const keys = new Set((sort.categories ?? []).map((c) => c.key));
  if (keys.size < 2) {
    add(file, "exercises.word_sort.categories", "error", "schema",
      "need at least 2 distinct categories");
  }
  if (keys.size !== (sort.categories ?? []).length) {
    add(file, "exercises.word_sort.categories", "error", "duplicate",
      "duplicate category key");
  }
  for (const c of sort.categories ?? []) {
    if (findBareLetters(c.key).length === 0 && /[ً-ْ]/.test(c.key)) {
      add(file, "exercises.word_sort.categories", "warn", "category-key",
        `key "${c.key}" carries tashkeel; keys are internal and should be bare`);
    }
    if (!c.label?.trim())
      add(file, "exercises.word_sort.categories", "error", "schema",
        `category "${c.key}" has no label`);
  }

  const words = sort.words ?? [];
  if (words.length < 10 || words.length > 15) {
    add(file, "exercises.word_sort.words", "warn", "sort-count",
      `${words.length} words; the guide calls for 10-15`);
  }
  const seenWords = new Set();
  const perCategory = new Map();
  for (const w of words) {
    if (!keys.has(w.category)) {
      add(file, "exercises.word_sort.words", "error", "dangling-category",
        `word "${w.word}" is in category "${w.category}", which is not declared`);
    }
    const wordKey = normalizeArabic(w.word);
    if (seenWords.has(wordKey)) {
      add(file, "exercises.word_sort.words", "error", "duplicate",
        `word "${w.word}" appears twice`);
    }
    seenWords.add(wordKey);
    perCategory.set(w.category, (perCategory.get(w.category) ?? 0) + 1);
  }
  for (const k of keys) {
    const n = perCategory.get(k) ?? 0;
    if (n === 0) {
      add(file, "exercises.word_sort.words", "error", "empty-category",
        `category "${k}" has no words`);
    } else if (words.length && n / words.length > 0.6) {
      add(file, "exercises.word_sort.words", "warn", "sort-balance",
        `category "${k}" holds ${n}/${words.length} words; the sort is lopsided`);
    }
  }
}

/* ── Text checks ─────────────────────────────────────────────────────── */

function checkText(file, doc) {
  const strings = [];
  walkStrings(doc, "", strings);

  for (const [path, text] of strings) {
    if ((text.match(/\*\*/g)?.length ?? 0) % 2 !== 0) {
      add(file, path, "error", "markup",
        "odd number of ** markers; bold is unbalanced");
    }
    if (/\s{2,}/.test(text)) {
      add(file, path, "warn", "whitespace", "collapsed double space");
    }
    if (text !== text.trim()) {
      add(file, path, "warn", "whitespace", "leading or trailing whitespace");
    }

    for (const b of findBareLetters(text)) {
      add(file, path, b.severity === "error" ? "error" : "warn", "tashkeel",
        `«${b.word}» — «${b.letter}» at position ${b.position} carries no haraka` +
          (b.severity === "pausal" ? " (word-final, pausal form)" : ""));
    }
    for (const s of findLoneShadda(text)) {
      add(file, path, s.severity === "error" ? "error" : "warn", "tashkeel",
        `«${s.word}» — shadda on «${s.letter}» with no haraka`);
    }
  }
}

/* ── Cross-file integrity ────────────────────────────────────────────── */

function checkManifest(lessonIds) {
  const src = readFileSync(join(DATA, "course.ts"), "utf8");
  // Lightweight parse: course.ts is generated-adjacent and always this shape.
  const listed = [];
  for (const block of src.matchAll(/lessonIds:\s*\[([^\]]*)\]/g)) {
    for (const m of block[1].matchAll(/"([^"]+)"/g)) listed.push(m[1]);
  }

  if (!listed.length) {
    add("data/course.ts", "LEVELS", "error", "manifest",
      "no lessonIds parsed; the manifest shape changed and this check is blind");
    return;
  }

  for (const id of listed) {
    if (!lessonIds.has(id)) {
      add("data/course.ts", "LEVELS", "error", "manifest",
        `"${id}" is listed in a level but no lesson file defines it`);
    }
  }
  for (const id of lessonIds) {
    if (!listed.includes(id)) {
      add("data/course.ts", "LEVELS", "error", "manifest",
        `lesson "${id}" exists but is in no level, so it is unreachable in the app`);
    }
  }
  const dupes = listed.filter((id, i) => listed.indexOf(id) !== i);
  if (dupes.length) {
    add("data/course.ts", "LEVELS", "error", "manifest",
      `listed in more than one level: ${[...new Set(dupes)].join(", ")}`);
  }
}

/* ── Run ─────────────────────────────────────────────────────────────── */

const files = readdirSync(DATA)
  .filter((f) => /^lesson_\d+\.json$/.test(f))
  .filter((f) => !filter || f.includes(filter))
  .sort();

if (!files.length) {
  console.error(filter ? `No lesson files match "${filter}".` : "No lesson files found.");
  process.exit(1);
}

const seenIds = new Map();
for (const file of files) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(join(DATA, file), "utf8"));
  } catch (err) {
    add(file, "", "error", "json", `unparseable: ${err.message}`);
    continue;
  }
  checkLesson(file, doc, seenIds);
  checkText(file, doc);
}

if (!filter) checkManifest(new Set(seenIds.keys()));

const errors = findings.filter((f) => f.severity === "error");
const warns = findings.filter((f) => f.severity === "warn");

if (asJson) {
  console.log(JSON.stringify({ files, errors, warns }, null, 2));
} else {
  let current = null;
  for (const f of [...errors, ...warns]) {
    if (f.file !== current) {
      current = f.file;
      console.log(`\n${current}`);
    }
    const tag = f.severity === "error" ? "ERROR" : "warn ";
    console.log(`  ${tag} [${f.rule}] ${f.path}\n        ${f.message}`);
  }
  const scope = files.length === 1 ? files[0] : `${files.length} lessons`;
  console.log(
    `\n${errors.length} error(s), ${warns.length} warning(s) across ${scope}.`
  );
}

process.exit(errors.length ? 1 : 0);
