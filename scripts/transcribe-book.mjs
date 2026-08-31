#!/usr/bin/env node
/**
 * Turn scanned pages of the source book into Markdown, via Gemini.
 *
 * The PDF is 410 JBIG2 bitonal scans with no embedded text layer, so there is
 * nothing to extract locally — the pages have to be read by a vision model.
 * Pages are sent as a real PDF slice rather than rendered images, which keeps
 * the page order and layout intact for the model.
 *
 * Two modes:
 *   --survey 1-30      classify each page (volume, printed number, kind)
 *   1-30               transcribe those pages to Markdown
 *
 * Usage:
 *   node scripts/transcribe-book.mjs --survey 400-415
 *   node scripts/transcribe-book.mjs 14-40 --out source-content/vol1-part1.md
 *   node scripts/transcribe-book.mjs 14-40 --volume "الكتاب الأول"
 *
 * Page numbers are PDF page numbers (1-based), not the book's printed numbers.
 * source-content/page-map.json says what is on every page. Never send more than
 * 30 pages in one call.
 *
 * A transcription is not usable until two more things happen:
 *   node scripts/lint-transcription.mjs <the new file> --fix
 *   add the file to the `sources` list in data/coverage.json
 * Until it is in `sources`, coverage.mjs skips it and its sections are never
 * proposed as the next lesson.
 */

import { PDFDocument } from "pdf-lib";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, callGemini } from "./lib/gemini.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Hard cap per request. Beyond this the model starts dropping or compressing
 * pages rather than transcribing them, and a partial chunk is worse than a
 * missing one because it looks complete.
 */
const MAX_PAGES = 30;

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? null : args[i + 1];
};

const src = flag("pdf") ?? "source-content/nahw-full-book.pdf";
const pdfPath = join(ROOT, src);
if (!existsSync(pdfPath)) {
  console.error(`No PDF at ${src}. Pass --pdf <path>.`);
  process.exit(2);
}

const survey = args.includes("--survey");
const rangeArg =
  (survey ? flag("survey") : null) ??
  args.find((a) => /^\d+-\d+$/.test(a) || /^\d+$/.test(a));

if (!rangeArg) {
  console.error("Give a page range, e.g. 14-40 (PDF page numbers, 1-based).");
  process.exit(2);
}

const [from, to] = rangeArg.includes("-")
  ? rangeArg.split("-").map(Number)
  : [Number(rangeArg), Number(rangeArg)];

if (!(from >= 1 && to >= from)) {
  console.error(`Bad range "${rangeArg}".`);
  process.exit(2);
}
if (to - from + 1 > MAX_PAGES) {
  console.error(
    `${to - from + 1} pages requested; the cap is ${MAX_PAGES}. ` +
      `Split it, or the model will start summarising instead of transcribing.`
  );
  process.exit(2);
}

/* ── Slice the PDF ───────────────────────────────────────────────────── */

const source = await PDFDocument.load(readFileSync(pdfPath), { ignoreEncryption: true });
const total = source.getPageCount();
if (to > total) {
  console.error(`Range ends at ${to} but the PDF has ${total} pages.`);
  process.exit(2);
}

const slice = await PDFDocument.create();
const copied = await slice.copyPages(
  source,
  Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i)
);
for (const p of copied) slice.addPage(p);
const sliceBytes = await slice.save();

console.error(
  `Sending PDF pages ${from}-${to} (${copied.length} pages, ${(sliceBytes.length / 1024).toFixed(0)} KB)…`
);

const pdfPart = {
  inline_data: {
    mime_type: "application/pdf",
    data: Buffer.from(sliceBytes).toString("base64"),
  },
};

const key = loadEnv();

/* ── Survey mode ─────────────────────────────────────────────────────── */

if (survey) {
  const SCHEMA = {
    type: "object",
    properties: {
      pages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer", description: "1-based position within this batch" },
            printed_page: { type: "string", description: "the page number printed on the page, in Arabic-Indic digits, or empty" },
            volume: { type: "string", description: "the volume named in the running header, or empty" },
            kind: {
              type: "string",
              enum: ["cover", "front_matter", "volume_title", "content", "exercises", "index", "blank", "other"],
            },
            heading: { type: "string", description: "the main heading on the page, if any" },
          },
          required: ["index", "printed_page", "volume", "kind", "heading"],
        },
      },
    },
    required: ["pages"],
  };

  const prompt = `You are given ${copied.length} consecutive scanned pages from an Arabic
grammar book. Do NOT transcribe them. For each page, in order, report only:

- the page number printed on the page (usually a corner, in Arabic-Indic digits)
- the volume named in the running header (e.g. الكتاب الأول), empty if none
- what kind of page it is
- the main heading on the page, if it has one

Classify \`kind\` as \`content\` for teaching prose, \`exercises\` for a تمرينات
block, \`index\` for a فهرس / table of contents, \`volume_title\` for a page whose
only content is a volume title, \`front_matter\` for copyright, dedication or
preface pages, and \`blank\` for an empty page.

Return one entry per page, ${copied.length} entries total.`;

  const { text, model, usage } = await callGemini({
    key,
    parts: [{ text: prompt }, pdfPart],
    schema: SCHEMA,
    temperature: 0,
    maxOutputTokens: 32000,
  });

  const { pages } = JSON.parse(text);
  console.error(`(${model}, ${usage?.totalTokenCount ?? "?"} tokens)\n`);
  console.log("pdf  printed  volume            kind          heading");
  for (const p of pages) {
    const pdfNo = from + p.index - 1;
    console.log(
      `${String(pdfNo).padStart(3)}  ${(p.printed_page || "-").padStart(6)}  ${(p.volume || "-").padEnd(16)}  ${p.kind.padEnd(12)}  ${p.heading || ""}`
    );
  }
  const out = flag("out");
  if (out) {
    writeFileSync(
      join(ROOT, out),
      JSON.stringify(pages.map((p) => ({ ...p, pdf_page: from + p.index - 1 })), null, 2)
    );
    console.error(`\nWrote ${out}`);
  }
  process.exit(0);
}

/* ── Transcription mode ──────────────────────────────────────────────── */

const volume = flag("volume");

const prompt = `I am attaching pages from an Arabic grammar book (الدروس النحوية).

Your task is to extract the raw Arabic text and format it into a clean, hierarchical
Markdown document.

Please adhere STRICTLY to the following rules:
1. **No Translation:** Keep the entire output in the original Arabic. Do not translate
   any headings, rules, or text into English.
2. **No JSON or Complex Structures:** Do not attempt to map this into JSON arrays or
   explain the structure to me. I only want the raw text formatted with Markdown.
3. **Markdown Formatting:** Use standard Markdown (\`#\` for main titles like
   "الكتاب الأول", \`##\` for lessons, \`###\` for exercises, and \`-\` or \`*\` for
   bullet points).
4. **Preserve Content:** Keep the original phrasing, examples, and exercises exactly as
   written in the document, including the tashkeel (harakat) exactly as printed.
5. **Clean up Artifacts:** Remove any raw page numbers, running headers, brackets, or
   OCR/source artifacts.
6. **Output only the Markdown.** No preamble, no commentary, no code fence around the
   whole document.
7. **Transcribe every page you are given, in order, completely.** Do not summarise,
   abridge, or skip repetitive material. If the first page begins mid-section, start
   transcribing mid-sentence rather than inventing a heading for it.
8. **Tables:** if the page shows a table, render it as a Markdown table.
${volume ? `\nThese pages are from ${volume}.` : ""}`;

const { text, model, usage } = await callGemini({
  key,
  parts: [{ text: prompt }, pdfPart],
  temperature: 0,
  maxOutputTokens: 65000,
});

// A model that ran out of room mid-page yields a plausible-looking but truncated
// document, which is the one failure that would silently corrupt the corpus.
// Canonical mark order at the corpus boundary, so every later comparison holds.
const markdown = text.trim().normalize("NFC");
const out = flag("out");
console.error(
  `(${model}, ${usage?.totalTokenCount ?? "?"} tokens, ${markdown.length} chars, ` +
    `${(markdown.match(/^#{1,3} /gm) ?? []).length} headings)`
);

if (out) {
  writeFileSync(join(ROOT, out), markdown + "\n");
  console.error(`Wrote ${out}`);
} else {
  console.log(markdown);
}
