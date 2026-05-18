import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "kanban.sqlite");

declare global {
  var __kanbanDb: Database.Database | undefined;
}

function createDatabase() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT 'light',
      language TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      owner_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_memberships (
      board_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      PRIMARY KEY (board_id, user_id),
      FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS card_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      is_express INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      column_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      deadline TEXT,
      assignee_user_id INTEGER,
      card_type_id INTEGER NOT NULL,
      is_express INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY(column_id) REFERENCES board_columns(id) ON DELETE CASCADE,
      FOREIGN KEY(assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(card_type_id) REFERENCES card_types(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      author_user_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY(author_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export function getDb() {
  if (!globalThis.__kanbanDb) {
    globalThis.__kanbanDb = createDatabase();
  }

  return globalThis.__kanbanDb;
}
