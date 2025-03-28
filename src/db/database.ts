// src/db/database.ts
import Database from 'better-sqlite3';
import path from 'path';

const dbFilePath = path.join(__dirname, '../../data/task_manager.db');
const db = new Database(dbFilePath);

// Define SQL schema
const createIssuesTable = `
  CREATE TABLE IF NOT EXISTS Issues (
    id INTEGER PRIMARY KEY,
    summary TEXT NOT NULL,
    description TEXT,
    status TEXT,
    priority TEXT,
    dueDate TEXT,
    epicId INTEGER,
    assignee TEXT
  );
`;

const createBoardsTable = `
  CREATE TABLE IF NOT EXISTS Boards (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  );
`;

const createIssueLinksTable = `
  CREATE TABLE IF NOT EXISTS IssueLinks (
    id INTEGER PRIMARY KEY,
    issueId INTEGER NOT NULL,
    linkedIssueId INTEGER NOT NULL,
    type TEXT,
    FOREIGN KEY (issueId) REFERENCES Issues(id),
    FOREIGN KEY (linkedIssueId) REFERENCES Issues(id)
  );
`;

const createWebhooksTable = `
  CREATE TABLE IF NOT EXISTS Webhooks (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT,
    active INTEGER DEFAULT 1
  );
`;

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT,
    password TEXT
  );
`;

const createAttachmentsTable = `
  CREATE TABLE IF NOT EXISTS Attachments (
    id INTEGER PRIMARY KEY,
    issueId INTEGER NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    FOREIGN KEY (issueId) REFERENCES Issues(id)
  );
`;

const createTransitionsTable = `
  CREATE TABLE IF NOT EXISTS Transitions (
    id INTEGER PRIMARY KEY,
    issueId INTEGER NOT NULL,
    fromStatus TEXT,
    toStatus TEXT,
    timestamp TEXT,
    userId INTEGER,
    FOREIGN KEY (issueId) REFERENCES Issues(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
  );
`;

const createEpicsTable = `
  CREATE TABLE IF NOT EXISTS Epics (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  );
`;

// Execute SQL scripts
function initializeDatabase() {
  db.exec(createIssuesTable);
  db.exec(createBoardsTable);
  db.exec(createIssueLinksTable);
  db.exec(createWebhooksTable);
  db.exec(createUsersTable);
  db.exec(createAttachmentsTable);
  db.exec(createTransitionsTable);
  db.exec(createEpicsTable);
}

initializeDatabase();

export default db;
