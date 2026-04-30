# Nahw — نَحْو

Mobile-first, RTL, Arabic-only interactive app for learning classical Arabic grammar (نَحْو). Beta-stage; built for heritage Arabic speakers and serious students of Qur'anic / classical Arabic.

For the product thesis, audience, and roadmap, see [`INVESTMENT.md`](./INVESTMENT.md).

---

## Tech stack

- **Framework:** Next.js 16 (App Router, standalone output) on React 19
- **Styling:** Tailwind CSS v4 with custom theme tokens (single amber palette)
- **Type:** TypeScript
- **Persistence:** SQLite via `better-sqlite3` (embedded, file-on-volume — no separate DB process)
- **Build / deploy:** GitHub Actions builds the Docker image → Coolify on a Pi pulls and runs
- **Font:** Noto Naskh Arabic (full tashkeel everywhere)

---

## Project structure

```
app/
  page.tsx              ← screen state machine (welcome / home / lesson / lesson_complete / curriculum_complete)
  layout.tsx            ← HTML shell, font, RTL setup
  globals.css           ← theme tokens (single amber palette), typography roles, animations
  api/
    subscribe/route.ts  ← POST email signups
    feedback/route.ts   ← POST per-lesson rating, PMF, learned-new, general comment

components/
  screens/
    OnboardingFlow.tsx     ← 3-screen first-load intro
    HomeScreen.tsx         ← lesson list + email capture footer
    LessonPlayer.tsx       ← step-by-step lesson runner (intro → concept → quick check → review → word sort)
    LessonComplete.tsx     ← compact rating dialog after each lesson
    CurriculumComplete.tsx ← end-of-available-content milestone screen (PMF + learned-new + email + comment)
  steps/                   ← lesson step renderers (intro, concept, quick-check, word-sort)
  ui/
    EmailCapture.tsx     ← reusable subscribe form, optional inline comment textarea
    LessonRating.tsx     ← 3-emoji "did you understand?" rating
    PMFRating.tsx        ← Sean Ellis "would you miss it?" question
    LearnedNew.tsx       ← thumbs-up/down "did you learn something new?"
    RichText.tsx         ← **bold** markup renderer
    conceptThemes.tsx    ← per-concept color theming inside lessons

data/
  course.ts             ← Book → Lesson manifest
  index.ts              ← lesson JSON registry
  lesson_*.json         ← lesson content (one file per lesson)
  AUTHORING.md          ← how to write a new lesson (source-of-truth doc)
  LESSON_PROMPT.md      ← copy-paste prompt for AI-assisted lesson drafts

lib/
  db.ts                 ← better-sqlite3 singleton + schema bootstrap

types/lesson.ts         ← Lesson, Concept, QuickCheck, WordSort types

scripts/
  make-logo-transparent.mjs  ← one-shot script that produced /public/nahw-mark.png from the original icon

public/
  icon.png              ← original brand icon (calligraphy on rounded card)
  nahw-mark.png         ← extracted transparent calligraphy (used in onboarding hero + home header)
```

For the lesson-content authoring pipeline (OCR → JSON → review), read [`data/AUTHORING.md`](./data/AUTHORING.md). It's the source of truth for content shape and review process.

---

## App flows

### First-load onboarding

`OnboardingFlow` shows on every app load (no localStorage gate during beta — intentional, so we keep re-validating the intro UX). Three screens:

1. **Hero**: app-icon mark + "تَعَلَّمِ النَّحْوَ خُطْوَةً بِخُطْوَةٍ" + subtitle
2. **Mini-exercise preview**: tap-the-verb interactive demo (cleared/reset per session)
3. **Curriculum scope**: "more than 100 lessons" + 5-stage progress path

Each screen has a `التَّالِي` button + a `تَخَطَّ` skip link until the last screen, where the CTA becomes `اِبْدَأْ رِحْلَتَكَ`.

### Lesson flow

```
HomeScreen → LessonPlayer (intro → concept → quick-check ×N → review → word-sort)
            → LessonComplete (compact rating dialog: emoji 1–3 + next CTA)
            → next lesson OR CurriculumComplete (if last)
```

`LessonComplete` is one-and-done per lesson — once a lesson has been "rated" (dialog shown), subsequent replays of that lesson skip the dialog and route directly to the next lesson. Tracked via `localStorage["nahw-lessons-rated"]` (JSON array of module_ids).

### Curriculum-end flow

`CurriculumComplete` only triggers on the *last available* lesson. It hosts three feedback modules:

1. **LearnedNew** — 👍/👎 binary, gated by `localStorage["nahw-learned-new-answered"]`
2. **PMFRating** — Sean Ellis "would you miss it" 3-button, gated by `localStorage["nahw-pmf-answered"]`
3. **EmailCapture** with `withComment` — subscribe + optional `تَعْلِيقَاتٌ` open-text, gated by `localStorage["nahw-subscribed"]`

If all three flags are set when the user finishes the last lesson, the milestone screen short-circuits straight to home — no empty-screen dead-end on replays.

---

## Theme system

Single amber palette. There used to be a multi-theme (amber / indigo / rose) runtime switcher; it was removed because the maintenance cost outweighed the benefit at beta scale.

All components use semantic tokens defined in [`app/globals.css`](./app/globals.css):

- `bg-page` / `bg-surface` / `bg-elevated`
- `text-heading` / `text-body` / `text-muted` / `text-faint`
- `bg-primary-soft` / `border-primary-border` / `text-primary-text` / `bg-primary-hover`
- `bg-success-soft` / `border-success-border` / `text-success-text` / `bg-success-strong` (used for the email capture and the milestone check)
- Typography: `type-display` (36) / `type-heading` (28) / `type-title` (24) / `type-body-lg` (18) / `type-body` (16) / `type-compact` (16, tight line-height)

**No hard-coded hex anywhere outside `globals.css`.** New components must use tokens.

---

## Data layer

### Storage

Single SQLite file. Path is read from `DATABASE_PATH` env var (default `./data/nahw.db` for dev). In production the Dockerfile sets `ENV DATABASE_PATH=/data/nahw.db` and Coolify mounts a host directory at `/data`.

The DB is initialized lazily by [`lib/db.ts`](./lib/db.ts) on the first import (i.e., first request to either API route). Schema is idempotent — `CREATE TABLE IF NOT EXISTS` so existing data is never touched on re-init. WAL journaling enabled.

### Schema

```sql
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT,
  source TEXT,                     -- 'home' | 'curriculum_complete' (extensible)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,              -- 'lesson_rating' | 'pmf' | 'learned_new' | 'general'
  rating INTEGER,                  -- 1..3 for kinds that have ratings; null for 'general'
  comment TEXT,
  context_id TEXT,                 -- lesson module_id when kind='lesson_rating'
  email TEXT COLLATE NOCASE,       -- auto-attached if user is subscribed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,              -- one of the event allowlist below
  session_id TEXT NOT NULL,        -- anonymous random UUID per device
  context_id TEXT,                 -- lesson module_id when relevant
  payload TEXT,                    -- JSON string for step_kind, etc; null otherwise
  email TEXT COLLATE NOCASE,       -- auto-attached if user is subscribed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Rating semantics

| kind | rating=1 | rating=2 | rating=3 |
|---|---|---|---|
| `lesson_rating` | لَا (didn't understand) | نَوْعًا مَا (sort of) | نَعَمْ (clear) |
| `pmf` | لَنْ أَفْتَقِدَهُ (wouldn't miss it) | سَأَفْتَقِدُهُ قَلِيلًا | سَأَفْتَقِدُهُ كَثِيرًا |
| `learned_new` | 👎 (no) | — (unused) | 👍 (yes) |
| `general` | — (null) | — | — |

Higher rating = more positive product signal (more attached / clearer / yes-learned).

### Event taxonomy

| `kind` | Fired when | `context_id` | `payload` |
|---|---|---|---|
| `app_open` | OnboardingFlow first mounts | — | — |
| `onboarding_complete` | User exits onboarding into home | — | — |
| `lesson_start` | LessonPlayer mounts | lesson `module_id` | — |
| `step_complete` | User taps "next" inside a lesson | lesson `module_id` | `{ step_kind }` |
| `lesson_complete` | LessonComplete dialog mounts | lesson `module_id` | — |
| `curriculum_complete` | CurriculumComplete mounts | — | — |

Events are fired client-side via [`lib/events.ts`](./lib/events.ts) with `keepalive: true` so they survive page unloads. Anonymous `session_id` is a UUID generated once per device, persisted in `localStorage["nahw-session-id"]`. Email auto-attaches once the user subscribes (same pattern as feedback).

### Email auto-attach

`EmailCapture` writes `localStorage["nahw-subscribed-email"] = <email>` on success. `LessonRating`, `PMFRating`, `LearnedNew` all read that on submit and include it in the request body. Anonymous feedback is fine (email column is nullable). Once a user subscribes, every subsequent rating/comment is correlated to their identity.

### Useful queries

```sql
-- Per-lesson average + count
SELECT context_id, ROUND(AVG(rating), 2) AS avg, COUNT(*) AS n
FROM feedback WHERE kind='lesson_rating' AND rating IS NOT NULL
GROUP BY context_id ORDER BY avg ASC;

-- PMF percentage (would-miss-it-a-lot share)
SELECT
  ROUND(100.0 * SUM(CASE WHEN rating=3 THEN 1 ELSE 0 END) / COUNT(*)) AS pct_very_attached,
  COUNT(*) AS responses
FROM feedback WHERE kind='pmf';

-- learned_new yes rate
SELECT
  ROUND(100.0 * SUM(CASE WHEN rating=3 THEN 1 ELSE 0 END) / COUNT(*)) AS pct_yes,
  COUNT(*) AS responses
FROM feedback WHERE kind='learned_new';

-- Comments worth reading
SELECT created_at, email, comment FROM feedback
WHERE comment IS NOT NULL AND length(comment) > 5
ORDER BY id DESC;

-- Daily unique app opens (events table)
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

-- Step-level drop-off — last step type completed per (session, lesson)
SELECT json_extract(payload, '$.step_kind') AS last_step, COUNT(*) AS sessions
FROM (
  SELECT session_id, context_id, payload,
         ROW_NUMBER() OVER (PARTITION BY session_id, context_id ORDER BY created_at DESC) AS rn
  FROM events WHERE kind = 'step_complete'
) WHERE rn = 1
GROUP BY last_step ORDER BY sessions DESC;

-- Sessions that subscribed at any point
SELECT COUNT(DISTINCT session_id) FROM events WHERE email IS NOT NULL;
```

---

## API routes

Both routes are in `app/api/*/route.ts`. Both:
- Accept JSON body, return `{ ok: true }` or `{ ok: false, error: "..." }` with 4xx
- Have a hidden `website` honeypot field; any non-empty value returns silent 200 without writing
- Are unauthenticated (open to the world); rate limiting handled at proxy level

### `POST /api/subscribe`
```json
{ "email": "user@example.com", "name": "أَحْمَد", "source": "home", "website": "" }
```
- Email validated server-side, lowercased, `INSERT OR IGNORE` so duplicate emails return 200 silently (idempotent).

### `POST /api/feedback`
```json
{ "kind": "lesson_rating", "rating": 2, "comment": "...", "context_id": "01_anwaa_al_kalimat", "email": "...", "website": "" }
```
- `kind` must be one of `lesson_rating | pmf | learned_new | general`
- `rating` required (1..3) for kinds that aren't `general`
- At least one of `rating` / `comment` must be present (rejected otherwise as `empty`)

---

## Local dev

```bash
npm install
npm run dev
```

- Local DB lands at `./data/nahw.db` (gitignored).
- Inspect with `sqlite3 data/nahw.db`.
- Hot-reload works for everything; if you delete files (e.g., a screen component), Turbopack sometimes needs `rm -rf .next && npm run dev` to recover.

If your dev machine isn't on `localhost` (e.g., you're testing from a phone on the LAN), add the IP to `next.config.ts`'s `allowedDevOrigins` array — otherwise HMR websocket gets blocked.

### Reset all gates for a clean walk-through

```js
['nahw-subscribed','nahw-subscribed-email','nahw-pmf-answered','nahw-learned-new-answered','nahw-lessons-rated'].forEach(k=>localStorage.removeItem(k));
location.reload();
```

---

## Deployment

### Pipeline

1. Push to `main` → GitHub Actions builds Docker image → pushes to `ghcr.io/rafikee/nahw:latest`.
2. Coolify on the Pi has a redeploy webhook (added in commit `615fac5`) that pulls and restarts the container.
3. New container starts with `/data` bind-mounted to the host filesystem.
4. First request to either API route triggers `lib/db.ts` to bootstrap schema (idempotent — existing tables and rows preserved).

### Coolify config (one-time, already done)

- **Persistent storage:**
  - Source path (host): `/data/coolify/nahw-data`
  - Destination path (container): `/data`
- **Env vars:** `DATABASE_PATH=/data/nahw.db` (also baked into the Dockerfile, redundant but harmless to set explicitly)

### Inspecting production data

```bash
ssh baradapi "sudo sqlite3 /data/coolify/nahw-data/nahw.db 'SELECT * FROM subscribers ORDER BY id DESC LIMIT 20'"
ssh baradapi "sudo sqlite3 /data/coolify/nahw-data/nahw.db 'SELECT * FROM feedback ORDER BY id DESC LIMIT 50'"
```

Sudo is required because the bind-mount directory is owned by the Docker daemon's user, not your login user.

### Backups

Currently **not configured**. To add (deferred task): nightly `cp` of `/data/coolify/nahw-data/nahw.db` to a Cloudflare R2 / Backblaze B2 bucket via a small cron, or use Litestream for continuous WAL streaming. The DB is small enough that simple copy backups are sufficient at beta scale.

---

## Beta signal capture: where each data point originates

| User action | Data captured | Where it appears |
|---|---|---|
| Subscribe via home screen footer | `subscribers` row, `source='home'` | HomeScreen `<EmailCapture source="home" />` |
| Subscribe via curriculum-end | `subscribers` row, `source='curriculum_complete'` + optional comment as `feedback(kind='general')` | CurriculumComplete `<EmailCapture withComment />` |
| Rate a lesson | `feedback(kind='lesson_rating', rating, context_id)` | LessonComplete dialog |
| Answer "would you miss it" | `feedback(kind='pmf', rating)` | CurriculumComplete `<PMFRating />` |
| Answer "did you learn something new" | `feedback(kind='learned_new', rating)` | CurriculumComplete `<LearnedNew />` |
| Open the app | `events(kind='app_open')` | OnboardingFlow mount |
| Finish onboarding | `events(kind='onboarding_complete')` | OnboardingFlow exit |
| Start a lesson | `events(kind='lesson_start', context_id=<lesson>)` | LessonPlayer mount |
| Advance any step inside a lesson | `events(kind='step_complete', payload={step_kind})` | LessonPlayer `goNext` |
| Reach lesson completion dialog | `events(kind='lesson_complete', context_id=<lesson>)` | LessonComplete mount |
| Reach end-of-curriculum screen | `events(kind='curriculum_complete')` | CurriculumComplete mount |

---

## Other docs in this repo

- [`INVESTMENT.md`](./INVESTMENT.md) — investor one-pager (vision, audience, market, roadmap)
- [`onboarding.md`](./onboarding.md) — onboarding redesign brief that drove the 3-screen flow
- [`email-capture-plan.md`](./email-capture-plan.md) — design plan for the email subscription system
- [`feedback-plan.md`](./feedback-plan.md) — design plan for the native product-feedback system
- [`data/AUTHORING.md`](./data/AUTHORING.md) — lesson authoring guide (source-of-truth for content shape)
- [`data/LESSON_PROMPT.md`](./data/LESSON_PROMPT.md) — AI-assisted lesson draft prompt
- [`AGENTS.md`](./AGENTS.md) — instructions for AI agents working in this repo

---

## Versioning

Version is tracked in `package.json` and surfaced in the settings sheet (`نُسْخَةٌ تَجْرِيبِيَّةٌ · vX.Y.Z`) so you can spot-check which build is live by tapping the gear icon. Bump the version in `package.json` whenever you ship a meaningful batch of changes.
