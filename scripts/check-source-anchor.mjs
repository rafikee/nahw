#!/usr/bin/env node
/**
 * Does the lesson's prose actually come from the book?
 *
 * The failure this exists to catch: everything in a lesson has a source anchor
 * except the framing sentences, so that is exactly where invented, essay-ish
 * copy creeps in. The book opens 20 of 21 teaching sections with its own boxed
 * one-line rule, and writes its own definitions — there is almost never a reason
 * to compose a new one.
 *
 * Measures the share of a lesson string's content words that appear anywhere in
 * the source section it claims. Particles and function words are ignored, and
 * Arabic is normalised (tashkeel dropped, alif/ya/ta-marbuta folded, article and
 * one-letter prefixes stripped) so morphological variation does not read as
 * invention.
 *
 * This is a smell test, not a plagiarism check. Low overlap means "justify this
 * or rewrite it from the book", not "this is wrong".
 *
 * Usage:
 *   node scripts/check-source-anchor.mjs              # every lesson
 *   node scripts/check-source-anchor.mjs lesson_5
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

/** Function words carry no evidence of sourcing either way. */
const STOP = new Set(
  ("من في الى على عن انه ان اذا او ثم قد كل بعض هذا هذه ذلك التي الذي هو هي ما لا " +
   "بها به له لها فيه فيها عليه عليها نحو مثل اي هل نعم بل لكن حتى كما عند بين " +
   "يكون تكون كان كانت وهو وهي مع دون غير سوى اما اذ كذلك هنا هناك").split(/\s+/)
);

/** Fold Arabic so morphology and orthography do not look like new words. */
function norm(word) {
  let w = word
    .normalize("NFC")
    .replace(/[ً-ْٰ]/g, "")   // tashkeel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^ء-ي]/g, "");
  w = w.replace(/^(ال)/, "");                 // definite article
  if (w.length > 3) w = w.replace(/^[وفبكل]/, ""); // one-letter prefixes
  return w;
}

const contentWords = (text) =>
  text
    .replace(/\*\*/g, " ")
    .split(/\s+/)
    .map(norm)
    .filter((w) => w.length > 2 && !STOP.has(w));

/** Fraction of the string's content words present in the source section. */
function anchorScore(text, sourceWords) {
  const words = contentWords(text);
  if (!words.length) return { score: 1, missing: [] };
  const missing = words.filter((w) => !sourceWords.has(w));
  return { score: (words.length - missing.length) / words.length, missing };
}

/* ── Locate each lesson's source section text ────────────────────────── */

const ledger = JSON.parse(readFileSync(join(DATA, "coverage.json"), "utf8"));

function sectionText(file, heading) {
  const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
  const norm1 = (s) => s.normalize("NFC").trim();
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,})\s+(.*?)\s*$/);
    if (m && norm1(m[2]) === norm1(heading)) {
      start = i + 1;
      level = m[1].length;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,})\s+/);
    // Stop at the next heading of the same or shallower depth; keep nested ones
    // (a section's own تمرينات belongs to it).
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

/* ── Run ─────────────────────────────────────────────────────────────── */

const filter = process.argv.slice(2).find((a) => !a.startsWith("--"));
const files = readdirSync(DATA)
  .filter((f) => /^lesson_\d+\.json$/.test(f))
  .filter((f) => !filter || f.includes(filter))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

const THRESHOLD = 0.55;
let flagged = 0;

for (const file of files) {
  const lesson = JSON.parse(readFileSync(join(DATA, file), "utf8"));
  const claims = ledger.claims.filter((c) => c.lesson === lesson.module_id);
  if (!claims.length) {
    console.log(`${file}: no coverage claim, cannot check sourcing`);
    continue;
  }

  const sourceWords = new Set();
  for (const c of claims) {
    const text = sectionText(c.file, c.heading);
    if (text) for (const w of contentWords(text)) sourceWords.add(w);
  }
  if (!sourceWords.size) {
    console.log(`${file}: source sections not found, cannot check sourcing`);
    continue;
  }

  const checks = [["introduction", lesson.introduction]];
  // Both bodies are optional; an examples-only intro_detail has none to check.
  if (lesson.intro_detail?.body) {
    checks.push(["intro_detail.body", lesson.intro_detail.body]);
  }
  if (lesson.intro_bonus?.body) {
    checks.push(["intro_bonus.body", lesson.intro_bonus.body]);
  }
  lesson.concepts.forEach((c, i) =>
    checks.push([`concepts[${i}].definition`, c.definition])
  );

  const rows = checks.map(([path, text]) => {
    const { score, missing } = anchorScore(text, sourceWords);
    return { path, score, missing };
  });

  const bad = rows.filter((r) => r.score < THRESHOLD);
  flagged += bad.length;

  console.log(`\n${file}  (${lesson.module_id})`);
  for (const r of rows) {
    const pct = Math.round(r.score * 100);
    const tag = r.score < THRESHOLD ? "LOW " : "ok  ";
    console.log(`  ${tag} ${String(pct).padStart(3)}%  ${r.path}`);
    if (r.score < THRESHOLD && r.missing.length) {
      console.log(`         not in source: ${r.missing.slice(0, 8).join(" ")}`);
    }
  }
}

console.log(
  `\n${flagged} string(s) below ${Math.round(THRESHOLD * 100)}% source overlap.`
);
process.exit(flagged ? 1 : 0);
