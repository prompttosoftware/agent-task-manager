// src/config/database.config.ts
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Create Tables
      db.run(`
        CREATE TABLE IF NOT EXISTS Issues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key VARCHAR(255) UNIQUE NOT NULL,
          issueTypeId INTEGER NOT NULL,
          projectId INTEGER NOT NULL,
          priorityId INTEGER NOT NULL,
          statusId INTEGER NOT NULL,
          assigneeId VARCHAR(255),
          summary VARCHAR(255) NOT NULL,
          description TEXT,
          labels TEXT,
          issueLinks TEXT,
          subtasks TEXT,
          progress_progress INTEGER,
          progress_total INTEGER,
          attachments TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (issueTypeId) REFERENCES IssueTypes(id),
          FOREIGN KEY (projectId) REFERENCES Projects(id),
          FOREIGN KEY (priorityId) REFERENCES Priorities(id),
          FOREIGN KEY (statusId) REFERENCES Statuses(id),
          FOREIGN KEY (assigneeId) REFERENCES Agents(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS IssueTypes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          subtask BOOLEAN,
          hierarchyLevel INTEGER
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Priorities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) UNIQUE NOT NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Statuses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) UNIQUE NOT NULL,
          boardId INTEGER
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Webhooks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(255) NOT NULL,
          events TEXT,
          filters TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          issueId INTEGER NOT NULL,
          filename VARCHAR(255) NOT NULL,
          filepath VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (issueId) REFERENCES Issues(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Agents (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255)
        )
      `);

      // Indexes
      db.run(`CREATE INDEX IF NOT EXISTS idx_issues_key ON Issues (key)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_issues_issueTypeId ON Issues (issueTypeId)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_issues_projectId ON Issues (projectId)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_issues_priorityId ON Issues (priorityId)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_issues_statusId ON Issues (statusId)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_issues_assigneeId ON Issues (assigneeId)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_attachments_issueId ON Attachments (issueId)`);

      // Data Initialization
      // Statuses
      db.run(`INSERT OR IGNORE INTO Statuses (name, boardId) VALUES ('To Do', 1)`);
      db.run(`INSERT OR IGNORE INTO Statuses (name, boardId) VALUES ('In Progress', 2)`);
      db.run(`INSERT OR IGNORE INTO Statuses (name, boardId) VALUES ('Done', 3)`);

      // Priorities
      db.run(`INSERT OR IGNORE INTO Priorities (name) VALUES ('High')`);
      db.run(`INSERT OR IGNORE INTO Priorities (name) VALUES ('Medium')`);
      db.run(`INSERT OR IGNORE INTO Priorities (name) VALUES ('Low')`);

      // Issue Types
      db.run(`INSERT OR IGNORE INTO IssueTypes (name) VALUES ('Bug')`);
      db.run(`INSERT OR IGNORE INTO IssueTypes (name) VALUES ('Task')`);
      db.run(`INSERT OR IGNORE INTO IssueTypes (name) VALUES ('Story')`);

    });
  }
});

export default db;
