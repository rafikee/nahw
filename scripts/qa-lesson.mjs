#!/usr/bin/env node
/**
 * Drive a lesson end to end in a real browser and report what breaks.
 *
 * Catches the class of problem the validator cannot see: RTL layout that
 * overflows, text that clips, a step that throws, a quick check whose feedback
 * state never renders. Screenshots every step so the result is reviewable
 * without re-running.
 *
 * Usage:
 *   npm run qa:lesson -- "أَنْوَاعُ الْكَلِمَاتِ"
 *   npm run qa:lesson -- 05_al_jumal --url http://localhost:3000
 *   npm run qa:lesson -- --all
 *
 * Screenshots land in .qa/<module_id>/NN-<step>.png (gitignored).
 */

import { chromium, devices } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? null : args[i + 1];
};

const PORT = flag("port") ?? "3111";
const externalUrl = flag("url");
const baseUrl = externalUrl ?? `http://localhost:${PORT}`;

/* Resolve which lessons to walk, by module_id or by title. */
const lessons = readdirSync(join(ROOT, "data"))
  .filter((f) => /^lesson_\d+\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(ROOT, "data", f), "utf8")));

const wanted = args.find((a) => !a.startsWith("--") && a !== PORT && a !== externalUrl);
const targets = args.includes("--all")
  ? lessons
  : lessons.filter((l) => l.module_id === wanted || l.title === wanted);

if (!targets.length) {
  console.error(
    `No lesson matched ${JSON.stringify(wanted)}. Known lessons:\n` +
      lessons.map((l) => `  ${l.module_id}  ${l.title}`).join("\n")
  );
  process.exit(2);
}

/* ── Dev server ──────────────────────────────────────────────────────── */

let server = null;
async function waitForServer(url, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev server never became ready at ${url}`);
}

if (!externalUrl) {
  server = spawn("npx", ["next", "dev", "--port", PORT], {
    cwd: ROOT,
    stdio: "ignore",
    detached: false,
  });
  process.on("exit", () => server?.kill());
  await waitForServer(baseUrl);
}

/* ── Walk ────────────────────────────────────────────────────────────── */

const problems = [];
const browser = await chromium.launch();
let failed = false;

for (const lesson of targets) {
  const outDir = join(ROOT, ".qa", lesson.module_id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const context = await browser.newContext({
    ...devices["iPhone 13"],
    locale: "ar",
  });
  const page = await context.newPage();

  const note = (kind, detail) => {
    problems.push({ lesson: lesson.module_id, kind, detail });
    failed = true;
  };

  page.on("console", (m) => {
    if (m.type() === "error") note("console-error", m.text());
  });
  page.on("pageerror", (e) => note("page-error", e.message));
  page.on("requestfailed", (r) => {
    // Favicon noise during dev is not worth failing a QA run over.
    if (!/favicon|\.map$/.test(r.url())) {
      note("request-failed", `${r.url()} — ${r.failure()?.errorText}`);
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  // Onboarding shows on every fresh load; تَخَطَّ skips straight to home.
  const skip = page.getByRole("button", { name: "تَخَطَّ" });
  if (await skip.isVisible().catch(() => false)) await skip.click();

  const card = page.getByRole("button").filter({ hasText: lesson.title });
  if (!(await card.first().isVisible().catch(() => false))) {
    note("not-on-home", `no home-screen card shows the title ${lesson.title}`);
    await context.close();
    continue;
  }
  await card.first().click();

  const shot = async (n, label) => {
    const name = `${String(n).padStart(2, "0")}-${label}.png`;
    await page.screenshot({ path: join(outDir, name) });

    // Mobile-first layout: nothing should scroll sideways.
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return d.scrollWidth - d.clientWidth;
    });
    if (overflow > 1) note("h-overflow", `${label} overflows by ${overflow}px`);

    // Anything clipped is a rendering bug worth seeing.
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll("main *")]
        .filter((el) => el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflowY === "hidden")
        .map((el) => el.textContent?.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 3)
    );
    for (const c of clipped) note("clipped-text", `${label}: “${c}…”`);
  };

  let step = 0;
  const MAX_STEPS = 60;
  while (step < MAX_STEPS) {
    step++;
    const heading = (await page.locator("h1").first().textContent().catch(() => "")) ?? "";
    // Strip diacritics before slugifying: they are marks, not letters, so they
    // would otherwise each become a hyphen and shred the filename.
    const label =
      heading
        .replace(/[\u064B-\u0652\u0670]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24) || `step-${step}`;
    await shot(step, label);

    // If this step offers choices, answer it so the feedback state renders.
    const choices = page.locator("main button");
    const count = await choices.count();
    if (count > 0) {
      await choices.first().click();
      await page.waitForTimeout(400);
      await shot(step, `${label}-answered`);
    }

    const next = page.getByRole("button", { name: /التَّالِي|إِنْهَاءُ الدَّرْسِ/ });
    if (!(await next.isVisible().catch(() => false))) break;
    const isFinish = /إِنْهَاء/.test((await next.textContent()) ?? "");
    await next.click();
    await page.waitForTimeout(350);
    if (isFinish) {
      await shot(step + 1, "complete");
      break;
    }
  }

  if (step >= MAX_STEPS) note("runaway", "step loop hit its cap; navigation may not advance");

  console.log(`${lesson.module_id}: walked ${step} step(s) → .qa/${lesson.module_id}/`);
  await context.close();
}

await browser.close();
server?.kill();

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  [${p.kind}] ${p.lesson}: ${p.detail}`);
} else {
  console.log("\nNo console errors, layout overflow, or clipped text.");
}

process.exit(failed ? 1 : 0);
