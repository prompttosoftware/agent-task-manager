import { loadDatabase } from './loadDatabase';
import { saveDatabase } from './saveDatabase';
import { DbSchema } from '../models/DbSchema';
import { AnyIssue } from '../models/anyIssue';
import { DB_FILE_PATH } from './constants';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { expect, assert } from 'chai'; // Import expect and assert from chai
import 'mocha'; // Explicitly import mocha to ensure types are loaded

describe('persistence', () => {
  beforeEach(async () => {
    // Ensure the test file doesn't exist before each test
    try {
      await fs.unlink(DB_FILE_PATH);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        // Ignore "file not found" errors; re-throw others
        throw error;
      }
    }
    // Clean up .data directory
    const dirPath = path.dirname(DB_FILE_PATH);
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
        if ((error as any).code !== 'ENOENT') {
            throw error;
        }
    }
  });

  it('should load and initialize database if file does not exist', async () => {
    const db = await loadDatabase();
    expect(db).to.deep.equal({ issues: [], issueKeyCounter: 0 }); // Use Chai's deep.equal
  });

  it('should save and load database correctly', async () => {
    const now = new Date().toISOString();
    const initialData: DbSchema = {
      issues: [
        {
          id: uuidv4(), // Generate UUID
          key: 'ATM-1', // Example key
          issueType: "Task", // Changed from IssueType.Task to string literal
          summary: 'Implement user authentication', // Example summary
          description: 'As a user, I want to be able to log in...', // Example description
          status: "Todo", // Changed from Status.ToDo to string literal
          createdAt: now, // Current time
          updatedAt: now, // Current time
        } as AnyIssue // Cast to AnyIssue to satisfy type
      ],
      issueKeyCounter: 1
    };
    await saveDatabase(initialData);
    const loadedData = await loadDatabase();
    // Deep comparison using toEqual should work for JSON-like objects
    expect(loadedData).to.deep.equal(initialData); // Use Chai's deep.equal
  });

  it('should create the .data directory if it does not exist', async () => {
    // Ensure the .data directory does not exist
    const dirPath = path.dirname(DB_FILE_PATH);
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
          throw error;
      }
    }

    // Now call loadDatabase which should create the directory
    await loadDatabase();

    // Check if the directory was created
    try {
        await fs.access(dirPath);
        // If access succeeds, the directory exists. Nothing more to do.
    } catch (error) {
        // If access fails, the directory was not created.
        assert.fail(".data directory was not created"); // Use Chai's assert.fail
    }
  });
});
