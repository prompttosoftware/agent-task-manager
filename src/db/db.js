// src/db/db.js
import Database from 'better-sqlite3';

const db = new Database('data/task_manager.db', { verbose: console.log });

// Create issues table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary TEXT,
    description TEXT,
    status TEXT
  );
`);

// Create webhooks table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT,
    active INTEGER DEFAULT 1
  );
`);

export default db;