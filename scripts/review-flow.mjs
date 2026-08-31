#!/usr/bin/env node
/**
 * Pedagogical review of a lesson: sequence, redundancy, and page density.
 *
 * Separate from gemini-review.mjs, which judges whether the Arabic is *correct*.
 * This one judges whether the lesson *teaches well* — a lesson can be flawless
 * Arabic and still restate its own introduction, name a term the learner has no
 * way to interpret yet, or put three ideas on one screen.
 *
 * It sees the lesson as the learner does: rendered as the actual step sequence
 * the player walks, not as raw JSON. It is also given a digest of every earlier
 * lesson, so it can flag material the course has already covered.
 *
 * Usage:
 *   node scripts/review-flow.mjs data/lesson_5.json
 *   node scripts/review-flow.mjs data/lesson_5.json --json
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, callGemini } from "./lib/gemini.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
if (!target) {
  console.error("Usage: node scripts/review-flow.mjs <lesson.json> [--json]");
  process.exit(2);
}

const lesson = JSON.parse(readFileSync(join(ROOT, target), "utf8"));

/** Render the lesson as the numbered screens the learner actually walks. */
function renderSteps(l) {
  const steps = [];
  const introBits = [
    `TITLE: ${l.title}`,
    `MAIN IDEA BOX: ${l.introduction}`,
  ];
  if (l.intro_detail) {
    introBits.push(
      `SECOND BOX — ${l.intro_detail.title}: ${l.intro_detail.body}` +
        (l.intro_detail.examples?.length
          ? ` [examples: ${l.intro_detail.examples.join(" ، ")}]`
          : "")
    );
  }
  // StepLessonIntro hides the preview grid when intro_detail is present, so the
  // reviewer must too — otherwise it reports on a screen the learner never sees.
  if (!l.intro_detail) {
    // Mirror StepLessonIntro exactly: grouped concepts are NOT previewed
    // individually — only the group's own card appears. Listing the children
    // here would invite findings about cards the learner never sees.
    const previewed = l.concepts.filter((c) => !c.group);
    const groupNames = [...new Set(l.concepts.filter((c) => c.group).map((c) => c.group))];
    const cards = [
      ...previewed.map((c) =>
        c.preview_hint ? `${c.type} (“${c.preview_hint}”)` : `${c.type} — NO HINT`
      ),
      ...groupNames.map((g) => `${g} (group card)`),
    ];
    introBits.push(`PREVIEW CARDS: ${cards.join(" | ")}`);
  }
  if (l.intro_bonus) {
    introBits.push(`ASIDE BOX — ${l.intro_bonus.title}: ${l.intro_bonus.body}`);
  }
  steps.push(`SCREEN 1 (lesson intro)\n${introBits.join("\n")}`);

  let n = 1;
  for (const c of l.concepts) {
    n++;
    const pairs = c.example_pairs?.length
      ? `\nPAIRS: ${c.example_pairs.map((p) => `${p.from} → ${p.to}`).join(" ، ")}`
      : "";
    steps.push(
      `SCREEN ${n} (concept)\nNAME: ${c.type}\nDEFINITION: ${c.definition}` +
        `\nEXAMPLES: ${c.examples.join(" ، ")}${pairs}`
    );
    n++;
    steps.push(
      `SCREEN ${n} (quick check)\nQ: ${c.quick_check.question}\n` +
        `OPTIONS: ${c.quick_check.options.map((o) => `${o.text}${o.correct ? " ✓" : ""}`).join(" | ")}\n` +
        `EXPLANATION: ${c.quick_check.explanation}`
    );
  }
  for (const q of l.exercises.review_quiz) {
    n++;
    steps.push(
      `SCREEN ${n} (review quiz)\nQ: ${q.question}\n` +
        `OPTIONS: ${q.options.map((o) => `${o.text}${o.correct ? " ✓" : ""}`).join(" | ")}\n` +
        `EXPLANATION: ${q.explanation}`
    );
  }
  const ws = l.exercises.word_sort;
  n++;
  steps.push(
    `SCREEN ${n} (sorting exercise)\nINSTRUCTION: ${ws.instruction}\n` +
      `CATEGORIES: ${ws.categories.map((c) => c.label).join(" | ")}\n` +
      `${ws.words.length} ENTRIES: ${ws.words.map((w) => w.word).join(" ، ")}`
  );
  return steps.join("\n\n");
}

/** Compact digest of everything taught before this lesson. */
function priorCoverage(currentId) {
  const files = readdirSync(DATA)
    .filter((f) => /^lesson_\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const out = [];
  for (const f of files) {
    const l = JSON.parse(readFileSync(join(DATA, f), "utf8"));
    if (l.module_id === currentId) break; // only what comes before
    out.push(
      `${l.module_id} — ${l.title}: ${l.concepts.map((c) => c.type).join(" ، ")}`
    );
  }
  return out.length ? out.join("\n") : "(none — this is the first lesson)";
}

const SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["ship", "revise", "restructure"] },
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          screen: { type: "string", description: "which screen, e.g. 'SCREEN 1' or 'SCREEN 2-3'" },
          severity: { type: "string", enum: ["major", "minor"] },
          category: {
            type: "string",
            enum: [
              "redundant_within_lesson",
              "already_taught_earlier",
              "term_used_before_taught",
              "screen_overloaded",
              "sequence_wrong",
              "exercise_mismatch",
              "weak_payoff",
            ],
          },
          problem: { type: "string" },
          suggestion: { type: "string" },
        },
        required: ["screen", "severity", "category", "problem", "suggestion"],
      },
    },
  },
  required: ["verdict", "summary", "findings"],
};

const prompt = `You are reviewing one lesson of an Arabic grammar course for a mobile app.
Judge it as a teacher reading over a colleague's lesson plan. Do NOT review the
Arabic for grammatical correctness — a separate reviewer does that, and reporting
it here is noise.

The learner sees one screen at a time and taps forward. They cannot go back and
re-read easily. Judge only these:

1. redundant_within_lesson — two screens making the same point. The commonest
   case is the intro screen and the first concept screen stating the same rule
   in different words.
2. already_taught_earlier — this lesson re-teaches something an earlier lesson
   already covered. Brief deliberate revision is fine and should NOT be flagged;
   flag it only when a concept is taught again as if new.
3. term_used_before_taught — a technical term shown to the learner before
   anything has explained it. The intro preview cards are the usual offender:
   naming a concept with no hint is meaningless to someone who has not met it.
4. screen_overloaded — one screen carrying more than a learner can absorb in a
   single read: too many ideas, too many examples, too much prose.
5. sequence_wrong — a screen that depends on something taught after it.
6. exercise_mismatch — a quick check or sorting exercise that does not test the
   thing the preceding screen taught, or that is longer than it needs to be to
   prove the learner has the rule.
7. weak_payoff — a screen that costs a tap but teaches nothing new.

Be specific and be sparing. A clean lesson should return few or no findings.
Set verdict to "ship" only if there are no major findings.

<already_taught_in_earlier_lessons>
${priorCoverage(lesson.module_id)}
</already_taught_in_earlier_lessons>

<lesson id="${lesson.module_id}">
${renderSteps(lesson)}
</lesson>`;

const key = loadEnv();
const { text, model } = await callGemini({
  key,
  parts: [{ text: prompt }],
  schema: SCHEMA,
  temperature: 0.3,
  maxOutputTokens: 16000,
});
const review = JSON.parse(text);

if (args.includes("--json")) {
  console.log(JSON.stringify(review, null, 2));
} else {
  const rank = { major: 0, minor: 1 };
  console.log(`\nVerdict: ${review.verdict.toUpperCase()}   (${model})`);
  console.log(review.summary);
  for (const f of [...review.findings].sort((a, b) => rank[a.severity] - rank[b.severity])) {
    console.log(`\n  [${f.severity}] ${f.category}  ${f.screen}`);
    console.log(`    problem:    ${f.problem}`);
    console.log(`    suggestion: ${f.suggestion}`);
  }
  const major = review.findings.filter((f) => f.severity === "major").length;
  console.log(`\n${review.findings.length} finding(s), ${major} major.`);
}
process.exit(review.verdict === "ship" ? 0 : 1);
