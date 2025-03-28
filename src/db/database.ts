// src/db/database.ts

import Database from 'better-sqlite3';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/task_manager.db';

let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
  if (!db) {
    db = new Database(DATABASE_PATH);
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};
