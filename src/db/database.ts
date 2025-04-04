// src/db/database.ts

import Database from 'better-sqlite3';

const db = new Database('data/task_manager.db');

// Create the 'boards' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT
  )
`);

// Create the 'issues' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY,
    board_id INTEGER,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (board_id) REFERENCES boards(id)
  )
`);

// Create the 'issue_links' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS issue_links (
    id INTEGER PRIMARY KEY,
    issue_id_from INTEGER,
    issue_id_to INTEGER,
    type TEXT,
    FOREIGN KEY (issue_id_from) REFERENCES issues(id),
    FOREIGN KEY (issue_id_to) REFERENCES issues(id)
  )
`);

// Create the 'webhooks' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY,
    url TEXT,
    event TEXT,
    secret TEXT,
    created_at DATETIME,
    updated_at DATETIME
  )
`);

// Create the 'users' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT,
    email TEXT,
    created_at DATETIME,
    updated_at DATETIME
  )
`);

// Create the 'attachments' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY,
    issue_id INTEGER,
    file_name TEXT,
    file_path TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (issue_id) REFERENCES issues(id)
  )
`);

// Create the 'transitions' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS transitions (
    id INTEGER PRIMARY KEY,
    issue_id INTEGER,
    from_status TEXT,
    to_status TEXT,
    transitioned_at DATETIME,
    FOREIGN KEY (issue_id) REFERENCES issues(id)
  )
`);

// Create the 'epics' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS epics (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME
  )
`);

export default db;
