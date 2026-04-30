import { NextResponse } from "next/server";
import { insertEvent } from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_RE = /^[A-Za-z0-9-]{1,60}$/;

const VALID_KINDS = new Set([
  "app_open",
  "onboarding_complete",
  "lesson_start",
  "step_complete",
  "lesson_complete",
  "curriculum_complete",
]);

type Body = {
  kind?: unknown;
  session_id?: unknown;
  context_id?: unknown;
  payload?: unknown;
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

  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  if (!SESSION_RE.test(sessionId)) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
  }

  let contextId: string | null = null;
  if (typeof body.context_id === "string") {
    const trimmed = body.context_id.trim();
    if (trimmed.length > 0 && trimmed.length <= 120) {
      contextId = trimmed;
    }
  }

  let payload: string | null = null;
  if (typeof body.payload === "string") {
    const trimmed = body.payload.trim();
    if (trimmed.length > 0) {
      if (trimmed.length > 500) {
        return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
      }
      try {
        JSON.parse(trimmed);
      } catch {
        return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
      }
      payload = trimmed;
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
    insertEvent.run(kind, sessionId, contextId, payload, email);
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
