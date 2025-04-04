// src/db/database.ts

import Database from 'better-sqlite3';

const db = new Database('data/task_manager.db', { verbose: console.log });

// Create the 'boards' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT
  )
`);

export default db;