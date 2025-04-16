import sqlite3 from 'sqlite3';
import { open } from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';

// Define the database file path
const dbFilePath = path.join('/usr/src/app/agent-task-manager/data', 'database.sqlite');

// Database connection object
let db: sqlite3.Database | null = null;

// Function to get the database connection
export async function getDBConnection(): Promise<sqlite3.Database> {
  if (!db) {
    db = await new Promise((resolve, reject) => {
      const newDb = new sqlite3.Database(dbFilePath, (err) => {
        if (err) {
          console.error('Failed to connect to the database:', err);
          reject(err);
        } else {
          console.log('Connected to the database.');
          resolve(newDb);
        }
      });
    });
  }
  return db;
}

// Function to initialize the database
export async function initializeDatabase(): Promise<void> {
  try {
    // Ensure the data directory exists
    const dataDir = path.dirname(dbFilePath);
    await fs.mkdir(dataDir, { recursive: true });

    // Check if the database file exists
    const dbFileExists = await fs.stat(dbFilePath).then(() => true).catch(() => false);

    if (!dbFileExists) {
      console.log('Database file does not exist. Initializing...');
      await createTables();
      await seedData();
    } else {
      // Check if the database file is empty
      const fileStats = await fs.stat(dbFilePath);
      if (fileStats.size === 0) {
          console.log('Database file is empty. Initializing...');
          await createTables();
          await seedData();
      } else {
        console.log('Database already initialized.');
      }
    }

  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Function to create tables
async function createTables(): Promise<void> {
  const db = await getDBConnection();
  await db.exec('PRAGMA foreign_keys = ON;'); // Enable foreign key constraints

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Statuses (
      id INTEGER PRIMARY KEY,
      name TEXT,
      code TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Issues (
      id INTEGER PRIMARY KEY,
      -- Add other issue fields here as needed
      title TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS IssueLinks (
      id INTEGER PRIMARY KEY
      -- Add other issue link fields here as needed
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Attachments (
      id INTEGER PRIMARY KEY
      -- Add other attachment fields here as needed
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Webhooks (
      id INTEGER PRIMARY KEY
      -- Add other webhook fields here as needed
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  console.log('Tables created.');
}

// Function to seed data
async function seedData(): Promise<void> {
  const db = await getDBConnection();

  // Seed Statuses table
  await db.exec(`
    INSERT OR IGNORE INTO Statuses (id, name, code) VALUES
    (11, 'To Do', 'open'),
    (21, 'In Progress', 'indeterminate'),
    (31, 'Done', 'done');
  `);
  console.log('Statuses seeded.');

  // Seed Metadata table
  await db.exec(`
    INSERT OR IGNORE INTO Metadata (key, value) VALUES
    ('last_issue_index', '0');
  `);
  console.log('Metadata seeded.');
}
