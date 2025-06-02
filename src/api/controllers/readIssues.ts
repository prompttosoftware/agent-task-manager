import { Request, Response } from 'express';
import { AnyIssue, DbSchema } from '../../models';
import { loadDatabase } from '../../dataStore';

/**
 * Retrieves all issues.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 * Responses:
 * - 200 OK: Successfully retrieved all issues. Returns an array of issue objects in the response body.
 * - 500 Internal Server Error: An error occurred on the server side. Returns `{ message: 'Internal server error' }`.
 */
export const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    let db: DbSchema;
    try {
      db = await loadDatabase(); // Direct DB access - TODO: Refactor to use service
    } catch (error) {
      console.error('Error loading database:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    res.status(200).json(db.issues);
  } catch (error) {
    console.error('Error getting issues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Retrieves an issue by its ID.
 * @param {Request} req - The Express request object.  The request must include the issue ID as a route parameter.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 * Responses:
 * - 200 OK: Successfully retrieved the issue. Returns the issue object in the response body.
 * - 404 Not Found: Issue not found. Returns `{ message: 'Issue not found' }`.
 * - 500 Internal Server Error: An error occurred on the server side. Returns `{ message: 'Internal server error' }`.
 */
export const getIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let db: DbSchema;
    try {
      db = await loadDatabase(); // Direct DB access - TODO: Refactor to use service
    } catch (error) {
      console.error('Error loading database:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    const issue = db.issues.find((issue) => issue.id === id);
    if (issue) {
      res.status(200).json(issue);
    } else {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
  } catch (error) {
    console.error('Error getting issue by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Retrieves an issue by its key.
 * @param {Request} req - The Express request object. The request must include the issue key as a route parameter.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 * Responses:
 * - 200 OK: Successfully retrieved the issue. Returns the issue object in the response body.
 * - 404 Not Found: Issue not found. Returns `{ message: 'Issue not found' }`.
 * - 500 Internal Server Error: An error occurred on the server side. Returns `{ message: 'Internal server error' }`.
 */
export const getIssueByKeyEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    let db: DbSchema;
    try {
      db = await loadDatabase(); // Direct DB access - TODO: Refactor to use service
    } catch (error) {
      console.error('Error loading database:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    const issue = db.issues.find((issue) => issue.key === key);
    if (issue) {
      res.status(200).json(issue);
    } else {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
  } catch (error) {
    console.error('Error getting issue by key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper functions for direct DB access (should eventually be moved or refactored)
// TODO: Refactor these helpers to use a service layer.
/**
 * Helper function to retrieve all issues directly from the database.
 * @returns {Promise<AnyIssue[]>} - A Promise that resolves with an array of all issues.
 */
export const getAllIssues = async (): Promise<AnyIssue[]> => {
  const db = await loadDatabase();
  return db.issues;
};

/**
 * Helper function to retrieve an issue by its ID directly from the database.
 * @param {string} id - The ID of the issue to retrieve.
 * @returns {Promise<AnyIssue | undefined>} - A Promise that resolves with the issue object if found, otherwise undefined.
 */
export const getIssueById = async (id: string): Promise<AnyIssue | undefined> => {
  const db = await loadDatabase();
  return db.issues.find((issue) => issue.id === id);
};

/**
 * Helper function to retrieve an issue by its key directly from the database.
 * TODO: Refactor other endpoints to use service layer.
 * @param {string} key - The key of the issue to retrieve.
 * @returns {Promise<AnyIssue | undefined>} - A Promise that resolves with the issue object if found, otherwise undefined.
 */
export const getIssueByKey = async (key: string): Promise<AnyIssue | undefined> => {
  const db = await loadDatabase();
  return db.issues.find((issue) => issue.key === key);
};
