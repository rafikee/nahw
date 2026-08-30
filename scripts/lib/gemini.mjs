/**
 * Shared Gemini client: key loading, model fallback, and retry.
 *
 * Split out because the reviewer and the transcriber hit the same three walls —
 * a key whose reachable models change with billing state, Flash models that
 * throw transient 503s under load, and per-model quotas. Handling that in one
 * place keeps both callers about their actual job.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const API = "https://generativelanguage.googleapis.com/v1beta";

/** Strongest first. Flash by choice: it is calibrated and materially cheaper. */
export const DEFAULT_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
];

export function loadEnv() {
  const path = join(ROOT, ".env.local");
  if (existsSync(path)) {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error(
      "GEMINI_API_KEY is not set. Put it in .env.local (already gitignored) as:\n" +
        "  GEMINI_API_KEY=..."
    );
    process.exit(2);
  }
  return key;
}

export async function listModels(key) {
  const res = await fetch(`${API}/models?key=${key}&pageSize=200`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const { models = [] } = await res.json();
  return models.filter((m) =>
    (m.supportedGenerationMethods ?? []).includes("generateContent")
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function once({ key, model, parts, schema, temperature, maxOutputTokens }) {
  const generationConfig = { temperature };
  if (schema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = schema;
  }
  if (maxOutputTokens) generationConfig.maxOutputTokens = maxOutputTokens;

  const res = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? `HTTP ${res.status}`);
    err.status = res.status;
    // 503 is load and 429 is quota; both clear on their own. 400/404 do not.
    err.retryable = res.status === 503 || res.status === 429;
    const delay = body?.error?.details?.find((d) =>
      d["@type"]?.endsWith("RetryInfo")
    )?.retryDelay;
    err.retryAfter = delay ? Number(String(delay).replace("s", "")) * 1000 : null;
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason ?? "unknown";
    const err = new Error(`empty response (finishReason: ${reason})`);
    // A truncated answer will truncate again at the same cap; surface it instead.
    err.retryable = reason !== "MAX_TOKENS";
    err.finishReason = reason;
    throw err;
  }
  return { text, model, usage: data.usageMetadata ?? null };
}

/**
 * Call Gemini, walking the model chain and retrying transient failures.
 * `parts` is the raw parts array, so callers can mix text and inline PDF data.
 */
export async function callGemini({
  key,
  parts,
  schema = null,
  temperature = 0.2,
  maxOutputTokens = null,
  chain = DEFAULT_CHAIN,
  attempts = 3,
  onRetry = (msg) => console.error(msg),
}) {
  let lastErr = null;
  for (const model of chain) {
    for (let n = 1; n <= attempts; n++) {
      try {
        return await once({ key, model, parts, schema, temperature, maxOutputTokens });
      } catch (err) {
        lastErr = err;
        if (!err.retryable) {
          onRetry(`  ${model}: ${err.status ?? ""} ${err.message.slice(0, 100)}`);
          break; // next model in the chain
        }
        const wait = err.retryAfter ?? n * 8000;
        onRetry(
          `  ${model} attempt ${n}/${attempts}: ${err.message.slice(0, 80)} — retrying in ${Math.round(wait / 1000)}s`
        );
        if (n < attempts) await sleep(wait);
      }
    }
  }
  throw new Error(
    `every model failed (${chain.join(", ")}). Last error: ${lastErr?.message}`
  );
}
