// src/db/database.ts
import Database from 'better-sqlite3';

const db = new Database('data/task_manager.db', { verbose: console.log });

// Define database schema here, e.g.:
db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY,
    summary TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  );
`);

export default db;