import { NextResponse } from "next/server";
import { insertFeedback } from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_KINDS = new Set(["lesson_rating", "pmf", "general", "learned_new"]);

type Body = {
  kind?: unknown;
  rating?: unknown;
  comment?: unknown;
  context_id?: unknown;
  email?: unknown;
  website?: unknown;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot — silently accept and discard.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!VALID_KINDS.has(kind)) {
    return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 400 });
  }

  let rating: number | null = null;
  if (typeof body.rating === "number" && Number.isInteger(body.rating)) {
    if (body.rating < 1 || body.rating > 3) {
      return NextResponse.json({ ok: false, error: "invalid_rating" }, { status: 400 });
    }
    rating = body.rating;
  }

  if ((kind === "lesson_rating" || kind === "pmf" || kind === "learned_new") && rating === null) {
    return NextResponse.json({ ok: false, error: "invalid_rating" }, { status: 400 });
  }

  let comment: string | null = null;
  if (typeof body.comment === "string") {
    const trimmed = body.comment.trim();
    if (trimmed.length > 0) {
      comment = trimmed.slice(0, 2000);
    }
  }

  if (rating === null && comment === null) {
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  }

  let contextId: string | null = null;
  if (kind === "lesson_rating" && typeof body.context_id === "string") {
    const trimmed = body.context_id.trim();
    if (trimmed.length > 0 && trimmed.length <= 120) {
      contextId = trimmed;
    }
  }

  let email: string | null = null;
  if (typeof body.email === "string" && body.email.trim().length > 0) {
    const candidate = body.email.trim().toLowerCase();
    if (!EMAIL_RE.test(candidate)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    email = candidate;
  }

  try {
    insertFeedback.run(kind, rating, comment, contextId, email);
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
