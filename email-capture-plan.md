# Plan: Email capture for the beta pilot

## Context

The app is in beta. The single highest-leverage signal we can collect right now is **interest captured as email addresses** — these are durable, owned by us, and let us message users when new lessons ship or to convert them to a paid tier later. No backend exists yet. We've decided against managed/free-tier vendor DBs (rug-pull risk) and against Postgres (overkill for this scale). The agreed stack is **embedded SQLite via `better-sqlite3`**, file-on-volume, served from the same Coolify deployment as the Next.js app. Backups are out of scope for this plan and will be set up separately.

The capture surface is the `LessonComplete` screen, but only after the user finishes the **last available lesson** in the curriculum (when there is no next lesson). That's the highest-intent moment — the user just finished everything we have, asking "where can I get more?" Anywhere earlier is premature; anywhere later doesn't exist yet.

## Architecture at a glance

```
Browser ── POST /api/subscribe ── better-sqlite3 ── /data/nahw.db (Coolify volume)
```

One SQLite file, one API route, one form component, one integration into `LessonComplete`.

## Files to add

- **`lib/db.ts`** — singleton `better-sqlite3` connection. Reads path from `DATABASE_PATH` env var (default `./data/nahw.db` for local dev). Runs schema migration on first open via `db.exec(...)`. Exports the prepared insert statement.
- **`app/api/subscribe/route.ts`** — Next.js Route Handler, `POST` only. Validates the body, runs the insert, returns 200 on success (or on duplicate — idempotent).
- **`components/ui/EmailCapture.tsx`** — themed RTL form. Email input (required), name input (collapsed under an optional toggle), submit button, idle/submitting/success/error states. Honeypot field (hidden `<input name="website">`) to deter bots.

## Files to modify

- **`components/screens/LessonComplete.tsx`** — when `getNextLesson` returns `null` (last lesson done), render `<EmailCapture source="lesson_complete" />` above the existing CTA buttons. The "العَوْدَةُ إِلَى الرَّئِيسِيَّةِ" button stays, just demoted visually.
- **`package.json`** — add `better-sqlite3` to dependencies and `@types/better-sqlite3` to devDependencies.
- **`Dockerfile`** — add `RUN apk add --no-cache python3 make g++` to the builder stage so `better-sqlite3` can compile against the alpine target if no prebuilt binary matches the platform. Keep the runtime stage clean (no build tools). Also `mkdir -p /data` and `VOLUME /data` so Coolify mounts persistent storage at the right path.
- **`.gitignore`** — append `/data` so the local dev SQLite file isn't committed.
- **`.env.example`** (new) — document `DATABASE_PATH`.

## Schema

```sql
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);
```

`source` lets us tag where a signup came from (`lesson_complete`, future `home_banner`, etc.) so funnel analysis works without a migration. `COLLATE NOCASE` so `Foo@Bar.com` and `foo@bar.com` dedupe to one row.

## API contract

`POST /api/subscribe`

```json
{ "email": "user@example.com", "name": "أَحْمَد", "source": "lesson_complete", "website": "" }
```

- Email: required, must match a basic regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), trimmed and lowercased server-side.
- Name: optional, max 80 chars.
- Source: optional, max 40 chars, alphanumeric + underscore only (server filters anything else).
- `website`: honeypot — if non-empty, return 200 silently without inserting.
- Duplicate email: insert with `INSERT OR IGNORE`, return 200 either way (don't leak whether email exists).
- Response: `{ ok: true }` on success, `{ ok: false, error: "invalid_email" }` on 400.

## Frontend behaviour

- Component is dismissed on success and replaced with a small thank-you message.
- After successful submission, write `localStorage["nahw-subscribed"] = "1"`. On future visits, `EmailCapture` returns `null` if that flag is set — users who already subscribed don't see the form again.
- All copy in Arabic, full tashkeel, themed via existing tokens. Container: `bg-primary-soft` card with `border-primary-border` to match the lesson cards on home (consistent "warm content card" pattern). CTA: same `bg-primary-hover` / `text-on-primary` pattern as everywhere else. No new tokens, no hex.

### Arabic copy (drafts)

- Heading: `هَلْ تُرِيدُ الْمَزِيدَ؟`
- Sub: `اِتْرُكْ بَرِيدَكَ وَسَنُخْبِرُكَ عِنْدَ إِضَافَةِ دُرُوسٍ جَدِيدَةٍ.`
- Email placeholder: `بَرِيدُكَ الْإِلِكْتُرُونِيُّ`
- Name toggle: `أَضِفِ اسْمَكَ (اِخْتِيَارِيٌّ)`
- Submit: `اِشْتَرِكْ`
- Success: `تَمَّ! سَنُخْبِرُكَ قَرِيبًا.`
- Error: `حَدَثَ خَطَأٌ، حَاوِلْ مَرَّةً أُخْرَى.`

## Coolify deployment

1. In Coolify's volume settings for the service, add a persistent volume mounted at `/data`.
2. Set environment variables: `DATABASE_PATH=/data/nahw.db`.
3. The first cold start initializes the schema via `lib/db.ts`. Subsequent restarts reuse the existing file.
4. Existing GitHub Actions build pipeline already handles multi-arch Docker — `better-sqlite3` ships prebuilt binaries for `linux/arm64` and `linux/amd64`, so no extra config needed unless the Pi build fails (in which case the python3+g++ in the builder stage handles a source compile fallback).

## Local dev

- `npm install` pulls `better-sqlite3` (with platform-specific prebuilt binary).
- App auto-creates `./data/nahw.db` on first request to `/api/subscribe`.
- Inspect rows with `sqlite3 data/nahw.db "SELECT * FROM subscribers"` or the SQLite VS Code extension.
- The git repo never tracks `/data` (added to `.gitignore`).

## Verification

1. `npx next build` — type-check and ensure the route + native module link cleanly.
2. `npm run dev`, complete the last lesson (lesson 4 currently), confirm:
   - Email capture appears on `LessonComplete` only when there's no next lesson
   - Submitting valid email returns success state, hides on subsequent visits
   - Submitting invalid email shows the error state
   - Network tab shows `POST /api/subscribe` with 200 response
3. `sqlite3 data/nahw.db "SELECT * FROM subscribers"` shows the row with the right `source`.
4. Submit twice with the same email → still 200, but only one row in the DB (dedupe).
5. Manually `POST` with the honeypot field filled → 200, no row written.
6. After deploying to Coolify with the volume mounted, repeat (2)–(4) against the live URL.

## Out of scope for this plan

- **Backups** — to be configured separately (Litestream, nightly `cp` to R2, or off-box snapshot).
- **Feedback collection** — deferred; Tally is fine for unstructured feedback when added later.
- **Admin UI** — read directly from the DB file via `sqlite3` CLI for now.
- **Email-on-submission notification** (Resend, etc.) — easy to add later if signal volume warrants it.
- **Rate limiting beyond the honeypot** — Coolify/proxy-level limits are sufficient for beta scale.
