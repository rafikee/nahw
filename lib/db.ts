import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_PATH = resolve(process.cwd(), "data", "nahw.db");
const DB_PATH = process.env.DATABASE_PATH ?? DEFAULT_PATH;

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT,
    source TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);

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
`);

export const insertSubscriber = db.prepare(
  "INSERT OR IGNORE INTO subscribers (email, name, source) VALUES (?, ?, ?)"
);

export const insertFeedback = db.prepare(
  "INSERT INTO feedback (kind, rating, comment, context_id, email) VALUES (?, ?, ?, ?, ?)"
);

export const insertEvent = db.prepare(
  "INSERT INTO events (kind, session_id, context_id, payload, email) VALUES (?, ?, ?, ?, ?)"
);

export default db;
