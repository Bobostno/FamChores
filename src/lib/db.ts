import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { seed } from "./seed";

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "family.db");

declare global {
  // Reuse one connection across dev hot-reloads instead of leaking file handles.
  var __familyHubDb: DatabaseSync | undefined;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      invite_code TEXT    NOT NULL UNIQUE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id     INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      username      TEXT    NOT NULL UNIQUE,
      name          TEXT    NOT NULL,
      role          TEXT    NOT NULL CHECK (role IN ('parent','kid')),
      emoji         TEXT    NOT NULL DEFAULT '\u{1F464}',
      color         TEXT    NOT NULL DEFAULT '#8b5cf6',
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id);

    CREATE TABLE IF NOT EXISTS chores (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id   INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      emoji       TEXT    NOT NULL DEFAULT '\u{1F9F9}',
      points      INTEGER NOT NULL DEFAULT 5,
      days_mask   INTEGER NOT NULL DEFAULT 127,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_chores_family ON chores(family_id);

    CREATE TABLE IF NOT EXISTS completions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id    INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      due_date    TEXT    NOT NULL,
      status      TEXT    NOT NULL CHECK (status IN ('open','done','approved')),
      done_at     TEXT,
      approved_at TEXT,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE (chore_id, due_date)
    );
    CREATE INDEX IF NOT EXISTS idx_completions_due ON completions(due_date);

    -- Append-only: balances are always SUM(amount), so points can never drift.
    CREATE TABLE IF NOT EXISTS points_ledger (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount     INTEGER NOT NULL,
      reason     TEXT    NOT NULL,
      kind       TEXT    NOT NULL CHECK (kind IN ('chore','bonus','penalty','reward')),
      ref_id     INTEGER,
      actor_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ledger_user ON points_ledger(user_id);

    CREATE TABLE IF NOT EXISTS rewards (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id  INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      title      TEXT    NOT NULL,
      emoji      TEXT    NOT NULL DEFAULT '\u{1F381}',
      cost       INTEGER NOT NULL,
      stock      INTEGER NOT NULL DEFAULT -1,
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_rewards_family ON rewards(family_id);

    CREATE TABLE IF NOT EXISTS redemptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_id  INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cost       INTEGER NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function createDb(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  seed(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__familyHubDb) {
    globalThis.__familyHubDb = createDb();
  }
  return globalThis.__familyHubDb;
}
