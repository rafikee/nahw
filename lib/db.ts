import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_PATH = resolve(process.cwd(), "data", "nahw.db");

const SCHEMA = `
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
`;

let handle: Database.Database | null = null;

/**
 * Opened on first query, never at import time.
 *
 * `next build` evaluates every route module to collect page data, and it does
 * that in parallel workers. Opening the database at module scope meant each
 * worker raced the others to run the schema block against the same file, which
 * fails with SQLITE_BUSY. That only ever passed because the image was built
 * under QEMU emulation, slowly enough that the workers did not overlap — the
 * first native arm64 build hit it on the first try. Nothing at build time needs
 * the database, so nothing at build time should open it.
 */
function getDb(): Database.Database {
  if (handle) return handle;

  const path = process.env.DATABASE_PATH ?? DEFAULT_PATH;
  mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);

  handle = db;
  return db;
}

/** Preserves the `insertX.run(...)` shape at the call sites. */
function lazyStatement(sql: string) {
  let stmt: Database.Statement | null = null;
  return {
    run(...params: Parameters<Database.Statement["run"]>) {
      stmt ??= getDb().prepare(sql);
      return stmt.run(...params);
    },
  };
}

export const insertSubscriber = lazyStatement(
  "INSERT OR IGNORE INTO subscribers (email, name, source) VALUES (?, ?, ?)"
);

export const insertFeedback = lazyStatement(
  "INSERT INTO feedback (kind, rating, comment, context_id, email) VALUES (?, ?, ?, ?, ?)"
);

export const insertEvent = lazyStatement(
  "INSERT INTO events (kind, session_id, context_id, payload, email) VALUES (?, ?, ?, ?, ?)"
);

export default getDb;
