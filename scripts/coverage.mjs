#!/usr/bin/env node
/**
 * What of the source book has become a lesson, and what comes next.
 *
 * Without this, "pick the next slice" is a judgment call re-made from scratch
 * every session, which drifts — sections get skipped, or covered twice under
 * different names. The ledger in data/coverage.json is the record of decisions
 * already made; this script reconciles it against the headings actually present
 * in source-content/ and names the next unclaimed slice.
 *
 * Usage:
 *   node scripts/coverage.mjs            # report
 *   node scripts/coverage.mjs --next     # just the next unclaimed section
 *   node scripts/coverage.mjs --json
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "source-content");
const LEDGER = join(ROOT, "data", "coverage.json");

const args = process.argv.slice(2);

/* ── Scan the source for sections ────────────────────────────────────── */

/**
 * A "section" is an H2 or deeper heading. H1 is the volume title and never a
 * lesson boundary on its own.
 */
function scanFile(path) {
  const lines = readFileSync(path, "utf8").split("\n");
  const heads = [];
  lines.forEach((line, i) => {
    const m = line.match(/^(#{2,})\s+(.*?)\s*$/);
    if (m) heads.push({ level: m[1].length, heading: m[2], start: i + 1 });
  });
  return heads.map((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].start - 1 : lines.length;
    const body = lines.slice(h.start, end).join(" ");
    return {
      ...h,
      end,
      words: body.split(/\s+/).filter(Boolean).length,
      // Exercise blocks are converted, not taught, so they are not slices.
      isExercises: /تمرين/.test(h.heading),
    };
  });
}

if (!existsSync(SRC)) {
  console.error(`No source-content/ directory. Drop the book markdown there first.`);
  process.exit(2);
}

const onDisk = readdirSync(SRC).filter((f) => f.endsWith(".md"));
if (!onDisk.length) {
  console.error("source-content/ has no .md files yet.");
  process.exit(2);
}

const ledger = existsSync(LEDGER)
  ? JSON.parse(readFileSync(LEDGER, "utf8"))
  : { sources: [], claims: [] };

/**
 * Reading order is declared, never inferred. Filename sort would silently
 * interleave volumes and hand back the wrong "next slice" — which is exactly
 * the drift this ledger exists to prevent. Files on disk but absent from
 * `sources` are reported and skipped rather than guessed at.
 */
const declared = (ledger.sources ?? []).map((s) => s.file.replace(/^source-content\//, ""));
const undeclared = onDisk.filter((f) => !declared.includes(f));
const missing = declared.filter((f) => !onDisk.includes(f));
const files = declared.filter((f) => onDisk.includes(f));

const sections = [];
for (const f of files) {
  for (const s of scanFile(join(SRC, f))) {
    sections.push({ ...s, file: relative(ROOT, join(SRC, f)) });
  }
}

const claimKey = (file, heading) => `${file}::${heading}`;
const claimed = new Map(
  ledger.claims.map((c) => [claimKey(c.file, c.heading), c])
);

const rows = sections.map((s) => ({
  ...s,
  claim: claimed.get(claimKey(s.file, s.heading)) ?? null,
}));

const teachable = rows.filter((r) => !r.isExercises);
const unclaimed = teachable.filter((r) => !r.claim);
const next = unclaimed[0] ?? null;

/* Warn about ledger entries whose heading no longer exists in the source. */
const orphans = ledger.claims.filter(
  (c) => !sections.some((s) => claimKey(s.file, s.heading) === claimKey(c.file, c.heading))
);

/* ── Output ──────────────────────────────────────────────────────────── */

if (args.includes("--json")) {
  console.log(JSON.stringify({ sections: rows, next, orphans, undeclared, missing }, null, 2));
  process.exit(0);
}

if (args.includes("--next")) {
  if (!next) {
    console.log("Every teachable section is claimed. The book is fully converted.");
    process.exit(0);
  }
  console.log(`${next.file}  lines ${next.start}-${next.end}  (${next.words} words)`);
  console.log(next.heading);
  process.exit(0);
}

let currentFile = null;
for (const r of rows) {
  if (r.file !== currentFile) {
    currentFile = r.file;
    console.log(`\n${currentFile}`);
  }
  const mark = r.isExercises ? "  ·  " : r.claim ? "  ✓  " : "  ○  ";
  const tail = r.claim
    ? `→ ${r.claim.lesson}`
    : r.isExercises
      ? "(exercises)"
      : `${r.words}w`;
  console.log(`${mark}${"  ".repeat(r.level - 2)}${r.heading.padEnd(40)} ${tail}`);
}

const done = teachable.length - unclaimed.length;
console.log(
  `\n${done}/${teachable.length} teachable sections converted. ` +
    `${unclaimed.length} remaining.`
);
if (next) console.log(`Next up: ${next.heading}  (${next.file} lines ${next.start}-${next.end})`);
if (orphans.length) {
  console.log(`\n${orphans.length} ledger entr(ies) reference headings no longer in the source:`);
  for (const o of orphans) console.log(`  ${o.lesson}: ${o.heading} (${o.file})`);
}
if (undeclared.length) {
  console.log(`\n${undeclared.length} file(s) on disk but not in \`sources\`, so skipped:`);
  for (const f of undeclared) console.log(`  ${f}`);
}
if (missing.length) {
  console.log(`\n${missing.length} file(s) declared in \`sources\` but not on disk:`);
  for (const f of missing) console.log(`  ${f}`);
}
