#!/usr/bin/env node
/**
 * Second-model review of a drafted lesson.
 *
 * Deliberately scoped to what only a language model can judge: whether the
 * Arabic is correct, whether each haraka is the *right* haraka, whether a
 * definition matches the classical rule, and whether the answer marked correct
 * actually is. Everything mechanically provable — schema, referential
 * integrity, tashkeel coverage — belongs to scripts/validate-lessons.mjs and is
 * not asked about here.
 *
 * Usage:
 *   node scripts/gemini-review.mjs --list-models
 *   node scripts/gemini-review.mjs data/lesson_5.json
 *   node scripts/gemini-review.mjs data/lesson_5.json --source source-content/vol1.md
 *   node scripts/gemini-review.mjs data/lesson_5.json --json
 *
 * Needs GEMINI_API_KEY in the environment or .env.local.
 * Override the model chain with GEMINI_MODEL or --model.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://generativelanguage.googleapis.com/v1beta";

/* ── Config ──────────────────────────────────────────────────────────── */

function loadEnvLocal() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvLocal();

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error(
    "GEMINI_API_KEY is not set. Put it in .env.local (already gitignored) as:\n" +
      "  GEMINI_API_KEY=..."
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};

/* ── Model discovery ─────────────────────────────────────────────────── */

async function listModels() {
  const res = await fetch(`${API}/models?key=${KEY}&pageSize=200`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const { models = [] } = await res.json();
  return models.filter((m) =>
    (m.supportedGenerationMethods ?? []).includes("generateContent")
  );
}

if (args.includes("--list-models")) {
  const models = await listModels();
  for (const m of models) {
    console.log(`${m.name.replace("models/", "").padEnd(45)} ${m.displayName}`);
  }
  console.log(`\n${models.length} models support generateContent.`);
  process.exit(0);
}

/* ── Review ──────────────────────────────────────────────────────────── */

const target = args.find((a) => !a.startsWith("--") && a !== flag("source") && a !== flag("model"));
if (!target) {
  console.error("Usage: node scripts/gemini-review.mjs <lesson.json> [--source <book.md>] [--json]");
  process.exit(2);
}

const lesson = readFileSync(join(ROOT, target), "utf8");
const sourcePath = flag("source");
const source = sourcePath ? readFileSync(join(ROOT, sourcePath), "utf8") : null;

const SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["publish", "fix_first", "reject"] },
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          severity: { type: "string", enum: ["critical", "major", "minor"] },
          category: {
            type: "string",
            enum: [
              "tashkeel_wrong",
              "grammar_error",
              "definition_inaccurate",
              "answer_wrong",
              "distractor_weak",
              "wordsort_miscategorised",
              "source_infidelity",
              "unnatural_phrasing",
            ],
          },
          quote: { type: "string" },
          problem: { type: "string" },
          correction: { type: "string" },
        },
        required: ["path", "severity", "category", "quote", "problem", "correction"],
      },
    },
  },
  required: ["verdict", "summary", "findings"],
};

const prompt = `You are a classical Arabic grammarian reviewing one lesson of an Arabic
grammar (نحو) mobile course. The lesson is JSON. Every user-facing string must be
correct, fully and *accurately* voweled Modern Standard Arabic in the classical
grammatical tradition.

Review ONLY these things. Another tool already proves schema validity and tashkeel
*presence*, so do not report missing diacritics as a structural matter — report a
haraka only when it is the WRONG haraka.

1. tashkeel_wrong — a diacritic that is present but incorrect. This is your single
   most important job. Check every i'rab ending against the word's grammatical role.
2. grammar_error — anything ungrammatical in the Arabic prose.
3. definition_inaccurate — a definition that misstates the classical rule.
4. answer_wrong — an MCQ whose \`correct: true\` option is not actually correct, or
   where more than one option is defensibly correct.
5. distractor_weak — a wrong option so obviously wrong it teaches nothing, or one
   that is arguably also correct.
6. wordsort_miscategorised — a word filed under a category it does not belong to.
7. unnatural_phrasing — correct but stilted Arabic a native teacher would not say.
${source ? "8. source_infidelity — a claim that contradicts the source book text provided below." : ""}

For \`path\`, use a JSON path into the lesson, like
\`concepts[2].quick_check.options[1].text\`. For \`correction\`, give the exact
replacement string, fully voweled — not a description of the fix.

Severity floor: a wrong haraka is never \`minor\`. Published content carrying an
incorrect diacritic teaches the error, so rank \`tashkeel_wrong\` and
\`answer_wrong\` as \`critical\`, and \`grammar_error\`,
\`definition_inaccurate\` and \`wordsort_miscategorised\` as at least \`major\`.
Reserve \`minor\` for style and phrasing.

Set \`verdict\` to "publish" only if there are no critical or major findings.

Note: word-final consonants written without a final haraka are intentional pausal
citation forms (الوقف) and are correct. Do not report them.

<lesson>
${lesson}
</lesson>
${source ? `\n<source_book>\n${source}\n</source_book>\n` : ""}`;

/**
 * Model chain, strongest first. The free tier reports a quota of 0 for every
 * Pro model and 404s the retired 2.5 line, and the Flash models throw
 * transient 503s under load — so a single hard-coded model makes this script
 * fail most of the time for reasons that have nothing to do with the lesson.
 */
const CHAIN = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3-flash-preview"];
const override = flag("model") ?? process.env.GEMINI_MODEL;
const chain = override ? [override] : CHAIN;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One attempt. Returns the parsed review, or throws with a `retryable` flag. */
async function attempt(model) {
  const res = await fetch(`${API}/models/${model}:generateContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? `HTTP ${res.status}`);
    err.status = res.status;
    // 503 is load and 429 is quota; both can clear. 404 and 400 cannot.
    err.retryable = res.status === 503 || res.status === 429;
    const delay = body?.error?.details?.find((d) => d["@type"]?.endsWith("RetryInfo"))?.retryDelay;
    err.retryAfter = delay ? Number(String(delay).replace("s", "")) * 1000 : null;
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason ?? "unknown";
    const err = new Error(`empty response (finishReason: ${reason})`);
    err.retryable = reason === "MAX_TOKENS";
    throw err;
  }
  return JSON.parse(text);
}

let review = null;
let model = null;
outer: for (const candidate of chain) {
  for (let tryN = 1; tryN <= 3; tryN++) {
    try {
      review = await attempt(candidate);
      model = candidate;
      break outer;
    } catch (err) {
      const where = `${candidate} attempt ${tryN}/3`;
      if (!err.retryable) {
        console.error(`${where}: ${err.status ?? ""} ${err.message}`);
        break; // move to the next model in the chain
      }
      const wait = err.retryAfter ?? tryN * 8000;
      console.error(`${where}: ${err.message.slice(0, 90)} — retrying in ${Math.round(wait / 1000)}s`);
      if (tryN < 3) await sleep(wait);
    }
  }
}

if (!review) {
  console.error(
    `\nEvery model in the chain failed: ${chain.join(", ")}.\n` +
      `Run --list-models to see what this key can reach.`
  );
  process.exit(1);
}

if (args.includes("--json")) {
  console.log(JSON.stringify(review, null, 2));
} else {
  const rank = { critical: 0, major: 1, minor: 2 };
  const sorted = [...review.findings].sort(
    (a, b) => rank[a.severity] - rank[b.severity]
  );
  console.log(`\nVerdict: ${review.verdict.toUpperCase()}   (${model})`);
  console.log(review.summary);
  for (const f of sorted) {
    console.log(`\n  [${f.severity}] ${f.category}  ${f.path}`);
    console.log(`    quote:      ${f.quote}`);
    console.log(`    problem:    ${f.problem}`);
    console.log(`    correction: ${f.correction}`);
  }
  const blocking = review.findings.filter((f) => f.severity !== "minor").length;
  console.log(
    `\n${review.findings.length} finding(s), ${blocking} blocking.`
  );
}

process.exit(review.verdict === "publish" ? 0 : 1);
