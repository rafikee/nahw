#!/usr/bin/env node
/**
 * Check a transcribed chunk before it becomes lesson source.
 *
 * A vision model transcribing Arabic makes a specific, repeatable class of
 * mistake: it writes hamzat wasl as hamzat qat' (الاسْم -> الأَسْم), because the
 * qat' spelling is far more common in its training data. That is invisible to
 * the lesson validator, which only proves a haraka is *present*, and it would
 * propagate into every lesson built from the chunk. Catching it at the corpus
 * boundary is much cheaper than catching it per lesson.
 *
 * Usage:
 *   node scripts/lint-transcription.mjs source-content/vol1-009-038.md
 *   node scripts/lint-transcription.mjs source-content/vol1-009-038.md --fix
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findBareLetters } from "./lib/tashkeel.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const fix = args.includes("--fix");
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
  console.error("Usage: node scripts/lint-transcription.mjs <file.md> [--fix]");
  process.exit(2);
}

const path = join(ROOT, target);
let text = readFileSync(path, "utf8").normalize("NFC");
const findings = [];

/**
 * Words beginning with hamzat wasl. After the definite article these are
 * written ال + bare alif, never الأ. Each entry is the stem as it appears
 * *after* the article, so the plural أَسْمَاء (a genuine hamzat qat') is not
 * matched and not touched.
 */
const WASL_STEMS = [
  { wrong: /الأَسْم(?![َ]ا)/g, right: "الْاسْم", gloss: "الاسم (singular)" },
  { wrong: /الأِبْن/g, right: "الْابْن", gloss: "الابن" },
  { wrong: /الأِثْن/g, right: "الْاثْن", gloss: "الاثنان" },
  { wrong: /الأِمْرَأ/g, right: "الْامْرَأ", gloss: "المرأة" },
  { wrong: /الأِسْتِ/g, right: "الْاسْتِ", gloss: "الاست-/استفعال forms" },
];

for (const { wrong, right, gloss } of WASL_STEMS) {
  const hits = [...text.matchAll(wrong)];
  if (!hits.length) continue;
  findings.push({
    rule: "hamzat-wasl",
    count: hits.length,
    message: `${gloss}: written with hamzat qat', should be hamzat wasl (${right})`,
  });
  if (fix) text = text.replace(wrong, right);
}

/**
 * The definite article's lam takes sukun before a moon letter, kasra before a
 * hamzat wasl word (الِاسْتِقْبَال), and is bare with a shadda on the following
 * consonant before a sun letter. Fixed orthography, not a judgement call, so a
 * missing mark can be restored deterministically. The model drops it constantly.
 *
 * Done per token rather than by regex lookbehind, because the article is often
 * preceded by a one-letter particle (وَالْ، فَالْ، بِالْ) whose haraka sits between
 * the particle and the alif.
 */
const MOON = /[\u0621-\u0625\u0628\u062C-\u062E\u0639\u063A\u0641-\u0643\u0645\u0647\u0648\u064A]/;
const HARAKA = /[\u064B-\u0652]/;
const LETTER_RE = /[\u0621-\u063A\u0641-\u064A]/;

function fixArticle(token) {
  // Optional single-letter particle (و ف ب ك ل ت) plus its haraka.
  const m = token.match(/^([\u0621-\u064A][\u064B-\u0652]*)?(\u0627)(\u0644)([\u064B-\u0652]*)(.)/u);
  if (!m) return token;
  const [, prefix = "", alif, lam, lamMarks, next] = m;
  if (prefix && !/^[\u0648\u0641\u0628\u0643\u0644\u062A]/.test(prefix)) return token;
  if (HARAKA.test(lamMarks)) return token; // already marked
  if (!LETTER_RE.test(next) && next !== "\u0627") return token;

  let mark = null;
  if (next === "\u0627") mark = "\u0650";        // wasl word after the article
  else if (MOON.test(next)) mark = "\u0652";      // moon letter -> sukun
  if (!mark) return token;                          // sun letter: lam stays bare

  return prefix + alif + lam + mark + token.slice((prefix + alif + lam + lamMarks).length);
}

{
  const tokens = text.split(/(\s+)/);
  let changed = 0;
  const fixed = tokens.map((t) => {
    const out = fixArticle(t);
    if (out !== t) changed++;
    return out;
  });
  if (changed) {
    findings.push({
      rule: "article-mark",
      count: changed,
      message: "definite article missing the sukun (moon letter) or kasra (wasl word) on its lam",
    });
    if (fix) text = fixed.join("");
  }
}

/* Latin text has no business in the transcription. */
const latin = [...text.matchAll(/[A-Za-z]{3,}/g)].map((m) => m[0]);
if (latin.length) {
  findings.push({
    rule: "latin-leak",
    count: latin.length,
    message: `Latin text present: ${[...new Set(latin)].slice(0, 5).join(", ")}`,
  });
}

/* Tashkeel coverage, reusing the lesson validator's rules. */
const bare = findBareLetters(text).filter((b) => b.severity === "error");
if (bare.length) {
  const words = [...new Set(bare.map((b) => b.word))];
  findings.push({
    rule: "tashkeel",
    count: bare.length,
    message: `${words.length} distinct words with an unvoweled letter mid-word: ${words.slice(0, 6).join(" ")}`,
  });
}

/* A chunk that stops mid-sentence is a truncated generation, not a page break. */
const tail = text.trimEnd().slice(-1);
if (!/[.؟!:»\d]/.test(tail)) {
  findings.push({
    rule: "truncation",
    count: 1,
    message: `ends on "${text.trimEnd().slice(-40)}" — may be truncated`,
  });
}

if (fix && findings.some((f) => f.rule === "hamzat-wasl" || f.rule === "article-mark")) {
  writeFileSync(path, text);
}

if (!findings.length) {
  console.log(`${target}: clean.`);
  process.exit(0);
}

console.log(`${target}`);
for (const f of findings) {
  const tag = fix && (f.rule === "hamzat-wasl" || f.rule === "article-mark") ? "FIXED" : "found";
  console.log(`  ${tag} [${f.rule}] ${f.count}x — ${f.message}`);
}
if (!fix) console.log(`\nRe-run with --fix to apply the deterministic orthographic corrections.`);
process.exit(fix ? 0 : 1);
