"use client";

const SESSION_KEY = "nahw-session-id";
const SUBSCRIBED_EMAIL_KEY = "nahw-subscribed-email";

function getSessionId(): string {
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function getEmail(): string | null {
  try {
    return window.localStorage.getItem(SUBSCRIBED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export interface TrackOptions {
  contextId?: string;
  payload?: Record<string, unknown>;
}

export function track(kind: string, opts?: TrackOptions): void {
  if (typeof window === "undefined") return;

  const body = {
    kind,
    session_id: getSessionId(),
    context_id: opts?.contextId,
    payload: opts?.payload ? JSON.stringify(opts.payload) : undefined,
    email: getEmail(),
    website: "",
  };

  try {
    void fetch("/api/event", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {
      /* fire-and-forget — never block UI on telemetry */
    });
  } catch {
    /* ignore */
  }
}
