# Plan: Native product feedback (lesson rating + curriculum-end milestone)

## Context

The app has email capture wired up. Now we add native product feedback so the beta produces roadmap signal, not just an email list. Two surfaces, three signal types, all stored in the existing SQLite DB.

- **After every lesson** (`LessonComplete`): a 3-emoji rating (😕 / 😐 / 😍) with optional comment. Quick "react to what you just did."
- **After the last available lesson** (new `CurriculumComplete` screen): PMF question + email-with-comment form. Dedicated milestone surface.
- **No settings entry, no in-lesson feedback button.** Feedback lives where the user just had something to react to.

The two moments are deliberately split: per-lesson is *look-back* energy (quick reaction), curriculum-end is *look-forward* energy (what now?). Cramming both into one screen muddles the mental shift.

## Architecture

Single `feedback` table in the same SQLite DB as `subscribers`. Flexible enough to absorb all three signal types (`lesson_rating`, `pmf`, `general`) without per-shape migrations later.

## Schema (added to `lib/db.ts`)

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  rating INTEGER,
  comment TEXT,
  context_id TEXT,
  email TEXT COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_feedback_kind_context ON feedback(kind, context_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
```

Rating semantics:
- `lesson_rating`: `1` = 😕 صَعْبٌ, `2` = 😐 جَيِّدٌ, `3` = 😍 مُمْتَازٌ
- `pmf`: `1` = لَا أُبَالِي, `2` = قَلِيلًا, `3` = مُحْبَطٌ جِدًّا (deeper number = more attached, mirrors Sean Ellis)
- `general`: `null` rating, comment is the payload

## Files to add

- **`app/api/feedback/route.ts`** — POST handler with validation, honeypot.
- **`components/ui/LessonRating.tsx`** — 3-emoji row + optional comment.
- **`components/ui/PMFRating.tsx`** — 3-button PMF row, gated by `localStorage["nahw-pmf-answered"]`.
- **`components/screens/CurriculumComplete.tsx`** — milestone screen with PMFRating + EmailCapture (with comment).

## Files to modify

- **`lib/db.ts`** — add the `feedback` schema + prepared `insertFeedback`.
- **`components/screens/LessonComplete.tsx`** — render `<LessonRating>` between stats and email capture; change last-lesson CTA to route to `curriculum_complete`.
- **`components/ui/EmailCapture.tsx`** — add optional `withComment` prop. Persist subscribed email to `localStorage["nahw-subscribed-email"]` on success.
- **`app/page.tsx`** — add `curriculum_complete` screen state + routing.

## API contract

`POST /api/feedback`

```json
{
  "kind": "lesson_rating",
  "rating": 2,
  "comment": "...",
  "context_id": "01_anwaa_al_kalimat",
  "email": "user@example.com",
  "website": ""
}
```

Server validation:
- `kind` must be `lesson_rating | pmf | general`. Otherwise 400.
- `rating`: 1..3 integer. Required for `lesson_rating` and `pmf`.
- `comment`: trim, max 2000 chars. At least one of `rating` or `comment` must be present.
- `context_id`: trim, max 120 chars, allowed only for `lesson_rating`.
- `email`: optional, validated by email regex if present.
- `website`: honeypot — silent 200 if non-empty.

Response: `{ ok: true }` or `{ ok: false, error: "..." }` with 400.

## Email auto-attach

`EmailCapture` writes `localStorage["nahw-subscribed-email"] = <email>` on success. `LessonRating` and `PMFRating` read this on submit and include it in the body if present.

## Arabic copy

**LessonRating** (on every `LessonComplete`):
- Heading: `كَيْفَ كَانَ الدَّرْسُ؟`
- Emoji labels: `صَعْبٌ` / `جَيِّدٌ` / `مُمْتَازٌ`
- Comment placeholder: `أَيُّ شَيْءٍ تَوَدُّ مُشَارَكَتَهُ؟ (اِخْتِيَارِيٌّ)`
- Send: `أَرْسِلْ`
- Toast: `شُكْرًا!`

**PMFRating** (on `CurriculumComplete`):
- Heading: `كَيْفَ سَتَشْعُرُ لَوْ اخْتَفَى نَحْوُ؟`
- Buttons: `مُحْبَطٌ جِدًّا` / `قَلِيلًا` / `لَا أُبَالِي`

**EmailCapture comment** (when `withComment`):
- Textarea: `مَا الَّذِي تَوَدُّ رُؤْيَتَهُ؟ (اِخْتِيَارِيٌّ)`

**CurriculumComplete**:
- Hero: `أَحْسَنْتَ!`
- Subhead: `لَقَدْ أَتْمَمْتَ كُلَّ مَا لَدَيْنَا حَتَّى الآنَ.`
- Body: `مُلَاحَظَاتُكَ تَصْنَعُ مَا يَأْتِي.`
- Done button: `إِنْهَاءٌ`

## Visual treatment

All existing theme tokens. No new hex. LessonRating uses `bg-success-soft` selection states; CurriculumComplete uses the same milestone celebration styling as LessonComplete.

## Verification

1. `npx next build`.
2. `npm run dev`, complete a lesson, tap rating, add comment, submit.
3. Subscribe to email → confirm `localStorage["nahw-subscribed-email"]` set.
4. Complete the last lesson → `CurriculumComplete` shows once, route to home.
5. `sqlite3 data/nahw.db "SELECT * FROM feedback ORDER BY id DESC"` shows expected rows.
6. Manual POST with bad kind/rating/honeypot → 400/silent 200 as designed.

## Out of scope

- Backups — separate task.
- Admin UI — `sqlite3` CLI for now.
- Email follow-ups, per-step ratings, settings/home feedback button.
- Rate limiting beyond honeypot.
