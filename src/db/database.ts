// src/db/database.ts
import Database from 'better-sqlite3';

const db = new Database('data/task_manager.db', { verbose: console.log });

// Define database schema here, e.g.:
// db.exec(`
//   CREATE TABLE IF NOT EXISTS tasks (
//     id INTEGER PRIMARY KEY,
//     description TEXT
//   );
// `);

export default db;
