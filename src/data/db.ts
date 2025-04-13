import { Database } from 'sqlite3';
import { open, Database as SQLiteDatabase } from 'sqlite';
import { Board } from '../types/board';
import { Issue } from '../types/issue';
import { Epic } from '../types/epic';

// Define the database file
const dbFile = 'database.db';

// Initialize the database connection
let db: SQLiteDatabase | null = null;

async function initializeDB(): Promise<SQLiteDatabase> {
  try {
    db = await open({
      filename: dbFile,
      driver: Database,
    });

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boardId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (boardId) REFERENCES boards(id)
      );

      CREATE TABLE IF NOT EXISTS epics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boardId INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (boardId) REFERENCES boards(id)
      );
    `);

    return db;

  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw err;
  }
}

// Immediately initialize the database
(async () => {
  try {
    db = await initializeDB();
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Handle the error appropriately, e.g., exit the application
  }
})();

// --- Boards CRUD Operations ---
export const getBoards = async (): Promise<Board[]> => {
  if (!db) throw new Error('Database not initialized');
  return db.all<Board[]>('SELECT * FROM boards');
};

export const getBoard = async (id: number): Promise<Board | undefined> => {
  if (!db) throw new Error('Database not initialized');
  return db.get<Board>('SELECT * FROM boards WHERE id = ?', id);
};

export const createBoard = async (board: Omit<Board, 'id'>): Promise<number> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.run(
    'INSERT INTO boards (name, description) VALUES (?, ?)',
    board.name,
    board.description
  );
  return result.lastID!;
};

export const updateBoard = async (id: number, board: Omit<Board, 'id'>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    'UPDATE boards SET name = ?, description = ? WHERE id = ?',
    board.name,
    board.description,
    id
  );
};

export const deleteBoard = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.run('DELETE FROM boards WHERE id = ?', id);

  //Also delete the associated issues and epics
  await db.run('DELETE FROM issues WHERE boardId = ?', id);
  await db.run('DELETE FROM epics WHERE boardId = ?', id);

};

// --- Issues CRUD Operations ---
export const getIssues = async (boardId?: number): Promise<Issue[]> => {
  if (!db) throw new Error('Database not initialized');
  if (boardId) {
    return db.all<Issue[]>('SELECT * FROM issues WHERE boardId = ?', boardId);
  }
  return db.all<Issue[]>('SELECT * FROM issues');
};

export const getIssue = async (id: number): Promise<Issue | undefined> => {
  if (!db) throw new Error('Database not initialized');
  return db.get<Issue>('SELECT * FROM issues WHERE id = ?', id);
};

export const createIssue = async (issue: Omit<Issue, 'id'>): Promise<number> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.run(
    'INSERT INTO issues (boardId, title, description, status) VALUES (?, ?, ?, ?)',
    issue.boardId,
    issue.title,
    issue.description,
    issue.status
  );
  return result.lastID!;
};

export const updateIssue = async (id: number, issue: Omit<Issue, 'id'>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    'UPDATE issues SET boardId = ?, title = ?, description = ?, status = ? WHERE id = ?',
    issue.boardId,
    issue.title,
    issue.description,
    issue.status,
    id
  );
};

export const deleteIssue = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.run('DELETE FROM issues WHERE id = ?', id);
};

// --- Epics CRUD Operations ---
export const getEpics = async (boardId?: number): Promise<Epic[]> => {
  if (!db) throw new Error('Database not initialized');
  if (boardId) {
    return db.all<Epic[]>('SELECT * FROM epics WHERE boardId = ?', boardId);
  }
  return db.all<Epic[]>('SELECT * FROM epics');
};

export const getEpic = async (id: number): Promise<Epic | undefined> => {
  if (!db) throw new Error('Database not initialized');
  return db.get<Epic>('SELECT * FROM epics WHERE id = ?', id);
};

export const createEpic = async (epic: Omit<Epic, 'id'>): Promise<number> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.run(
    'INSERT INTO epics (boardId, name, description) VALUES (?, ?, ?)',
    epic.boardId,
    epic.name,
    epic.description
  );
  return result.lastID!;
};

export const updateEpic = async (id: number, epic: Omit<Epic, 'id'>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    'UPDATE epics SET boardId = ?, name = ?, description = ? WHERE id = ?',
    epic.boardId,
    epic.name,
    epic.description,
    id
  );
};

export const deleteEpic = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.run('DELETE FROM epics WHERE id = ?', id);
};
