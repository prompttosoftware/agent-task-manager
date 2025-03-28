// src/db/database.ts

import Database from 'better-sqlite3';

const db = new Database('data/task_manager.db', { verbose: console.log });

export default db;