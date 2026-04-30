# Plan: Lightweight usage tracking (events table)

## Context

We have outcome signal (lesson ratings, PMF, learned-new) but no funnel signal. We can't currently answer "do users actually start lesson 2 after lesson 1?" or "where in the lesson do they drop off?" These are the most actionable diagnostics for a beta and they're poorly served by general web analytics.

Adds a thin usage-tracking layer to the existing SQLite DB. **No analytics platform**, no admin UI, no dashboards — just an events table, six client-side fires, and a handful of useful queries. Cloudflare Web Analytics (free, drop-in) handles traffic-level numbers separately and is orthogonal to this plan.

## Architecture

```
Client (lib/events.ts) ── POST /api/event ── better-sqlite3 ── /data/nahw.db (events table)
```

Same plumbing pattern as `/api/feedback`. Anonymous session ID in localStorage threads events from one device. Email auto-attaches once subscribed.

## Schema

```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  session_id TEXT NOT NULL,
  context_id TEXT,
  payload TEXT,
  email TEXT COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_kind_created ON events(kind, created_at);
```

Idempotent bootstrap — production DB picks it up safely on next deploy.

## Event types (allowlist)

| Event | Fired when | `context_id` | `payload` |
|---|---|---|---|
| `app_open` | `OnboardingFlow` first mounts | — | — |
| `onboarding_complete` | User exits onboarding | — | — |
| `lesson_start` | `LessonPlayer` mounts | lesson `module_id` | — |
| `step_complete` | User taps "next" inside a lesson | lesson `module_id` | `{ step_kind: 'lesson_intro' \| 'lesson_concept' \| 'lesson_quick_check' \| 'lesson_review_quiz' \| 'lesson_word_sort' }` |
| `lesson_complete` | `LessonComplete` mounts | lesson `module_id` | — |
| `curriculum_complete` | `CurriculumComplete` mounts | — | — |

## Files

**Add:**
- `lib/events.ts` — client `track(kind, opts?)` helper. Uses `crypto.randomUUID()` once for session, `keepalive: true` on fetch, fire-and-forget.
- `app/api/event/route.ts` — POST handler with kind allowlist + validation.

**Modify:**
- `lib/db.ts` — add events schema + prepared `insertEvent`.
- `OnboardingFlow.tsx`, `LessonPlayer.tsx`, `LessonComplete.tsx`, `CurriculumComplete.tsx` — fire the events.
- `README.md` — document the events table, taxonomy, and funnel queries.

## API contract

`POST /api/event`

```json
{
  "kind": "lesson_start",
  "session_id": "9a6c1e8e-...",
  "context_id": "01_anwaa_al_kalimat",
  "payload": "{\"step_kind\":\"lesson_concept\"}",
  "email": "user@example.com",
  "website": ""
}
```

Validation:
- `kind`: required, must be in allowlist
- `session_id`: required, regex `^[A-Za-z0-9-]{1,60}$`
- `context_id`: optional, max 120 chars
- `payload`: optional, must be JSON-parseable, max 500 chars
- `email`: optional, validated by email regex
- `website`: honeypot — silent 200 if non-empty

Returns `{ ok: true }` or `{ ok: false, error: "..." }` 400.

## Privacy

- Random UUID session_id, no fingerprinting
- No third-party trackers, no IP storage beyond Coolify proxy logs
- Email opt-in (auto-attached only after explicit subscribe)

## Useful queries (in README)

```sql
-- Daily unique app opens
SELECT date(created_at) AS day, COUNT(DISTINCT session_id) AS uniques
FROM events WHERE kind = 'app_open' GROUP BY day ORDER BY day DESC;

-- Onboarding completion rate
WITH starts AS (SELECT DISTINCT session_id FROM events WHERE kind='app_open'),
     done   AS (SELECT DISTINCT session_id FROM events WHERE kind='onboarding_complete')
SELECT (SELECT COUNT(*) FROM starts) AS opens,
       (SELECT COUNT(*) FROM done) AS completed,
       ROUND(100.0 * (SELECT COUNT(*) FROM done) / NULLIF((SELECT COUNT(*) FROM starts), 0)) AS pct;

-- Per-lesson start vs complete
SELECT context_id AS lesson,
       SUM(CASE WHEN kind='lesson_start' THEN 1 END) AS starts,
       SUM(CASE WHEN kind='lesson_complete' THEN 1 END) AS completes,
       ROUND(100.0 * SUM(CASE WHEN kind='lesson_complete' THEN 1 END) /
             NULLIF(SUM(CASE WHEN kind='lesson_start' THEN 1 END), 0)) AS pct
FROM events WHERE kind IN ('lesson_start','lesson_complete') AND context_id IS NOT NULL
GROUP BY context_id ORDER BY context_id;

-- Step-level drop-off
SELECT json_extract(payload, '$.step_kind') AS last_step, COUNT(*) AS sessions
FROM (
  SELECT session_id, context_id, payload,
         ROW_NUMBER() OVER (PARTITION BY session_id, context_id ORDER BY created_at DESC) AS rn
  FROM events WHERE kind = 'step_complete'
) WHERE rn = 1
GROUP BY last_step ORDER BY sessions DESC;
```

## Verification

1. `npx next build`.
2. `npm run dev`, walk through: welcome → onboarding → lesson → all steps → end → curriculum end. Check Network tab for one POST per event; check DB for matching rows.
3. Test bad inputs: invalid kind, missing session_id, oversized payload, honeypot — confirm 400 / silent 200 as designed.
4. Deploy and re-walk on the live URL; query `/data/coolify/nahw-data/nahw.db` via `ssh baradapi`.

## Out of scope

- Cloudflare Web Analytics (separate, drop-in)
- Admin UI / dashboards
- Event batching, retention policies, A/B framework
