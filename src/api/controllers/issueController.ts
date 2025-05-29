import { Request, Response } from 'express';
// Correct the import path for IssueCreationError and errorStatusCodeMap
import { IssueCreationError, errorStatusCodeMap } from '../../utils/errorHandling';
// Import necessary types from models
import { AnyIssue, DbSchema } from '../../models';
import { loadDatabase, saveDatabase } from '../../dataStore';
import { v4 as uuidv4 } from 'uuid';
import { createIssue } from '../../issueService'; // Changed import alias to match service function name

// Define allowed values for issue types and statuses
const allowedIssueTypes = ["Task", "Story", "Epic", "Bug", "Subtask"];
const allowedStatuses = ["Todo", "In Progress", "Done"];

// Define the map for issue type prefixes
const issueTypePrefixMap: { [key: string]: string } = {
  "Task": "TASK",
  "Story": "STOR",
  "Epic": "EPIC",
  "Bug": "BUG",
  "Subtask": "SUBT",
};

/**
 * Helper function to retrieve the key prefix for a given issue type.
 * Defaults to "GEN" if the type is not recognized.
 * @param issueType The type of the issue (e.g., "Task", "Story").
 * @returns The corresponding issue key prefix.
 */
const getIssueKeyPrefix = (issueType: string): string => {
  // Get the prefix from the map, default to "GEN" if not found
  return issueTypePrefixMap[issueType] || "GEN";
};

/**
 * Generates an issue key in the format [ISSUE_TYPE_PREFIX]-<counter>.
 * Uses prefixes TASK, STOR, EPIC, BUG, SUBT or defaults to GEN.
 * @param issueType The type of the issue (e.g., "Task", "Story").
 * @param counter The counter value to use in the key.
 * @returns The generated issue key string.
 */
const generateIssueKey = (issueType: string, counter: number): string => {
  const prefix = getIssueKeyPrefix(issueType);
  return `${prefix}-${counter}`;
};


/**
 * Creates a new issue based on the provided request body by calling the issue service.
 *
 * The request body is expected to contain the following fields:
 * - `issueType` (string, optional): The type of the issue. Must be one of "Task", "Story", "Epic", "Bug", "Subtask". Defaults to "Task" if not provided or invalid.
 * - `summary` (string, required): A concise summary of the issue. Cannot be empty.
 * - `description` (string, optional): A detailed description of the issue. Defaults to an empty string if not provided.
 * - `parentIssueKey` (string or null, optional): The key of the parent issue. Required for Subtasks.
 *
 * Note: The initial `status` of the issue is determined by the server based on the issue type and is not taken from the request body during creation.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 *
 * Responses:
 * - 201 Created: Successfully created the issue. Returns the created issue object in the response body.
 * - 400 Bad Request: If the request body contains invalid data, such as a missing required field (like `summary`), or an invalid/missing `parentIssueKey` for a Subtask. The response body will contain a `message` property detailing the validation error.
 * - 500 Internal Server Error: An unexpected error occurred on the server side (e.g., data store failure) or a service error not specifically mapped to 400. Returns `{ message: 'Internal server error' }` or a specific message from the service if available and appropriate.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    // Access fields based on the requested structure described in the JSDoc comments.
    // Validation logic is delegated to the addIssue service function.
    // The service function expects 'title' instead of 'summary' and 'issueTypeName' instead of 'issueType'.
    const { issueType, summary, status, description, parentIssueKey } = req.body; // status is included in req.body by convention but ignored by service

    // Prepare data for the service function.
    // The service function will handle validation of types, required fields, allowed values, etc.
    // Renamed 'summary' to 'title' to align with issueService.ts Input type
    const issueData = {
      issueTypeName: issueType as AnyIssue["issueType"], // Pass issueType as issueTypeName
      title: summary, // Pass summary as title
      description: description,
      // Status is now determined within the service based on type, ignore req.body.status
      parentKey: parentIssueKey, // Pass parentIssueKey as parentKey
    };

    // Call the createIssue service function (renamed from addIssue in this file)
    // Errors thrown by createIssue (including IssueCreationError) will be caught below.
    const newIssue = await createIssue(issueData); // Use the correct function name

    // On successful creation, return 201 Created with the new issue data.
    res.status(201).json(newIssue);

  } catch (error: any) {
    console.error('Error creating issue:', error);

    // Check if the error is a custom IssueCreationError from the service.
    if (error instanceof IssueCreationError) {
      // Map custom error code from the service to an appropriate HTTP status code.
      // Prioritize statusCode property from the error, fallback to map, then default to 500.
      const statusCode = error.statusCode || (error.errorCode && errorStatusCodeMap[error.errorCode]) || 500;
      res.status(statusCode).json({ message: error.message });
    } else {
      // Handle unexpected errors (e.g., database errors not wrapped in IssueCreationError).
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

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
      db = await loadDatabase();
    } catch (error) {
      console.error('Error loading database:', error);
      return res.status(500).json({ message: 'Internal server error' });
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
      db = await loadDatabase();
    } catch (error) {
      console.error('Error loading database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    const issue = db.issues.find(issue => issue.id === id);
    if (issue) {
      res.status(200).json(issue);
    } else {
      res.status(404).json({ message: 'Issue not found' });
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
      db = await loadDatabase();
    } catch (error) {
      console.error('Error loading database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    const issue = db.issues.find(issue => issue.key === key);
    if (issue) {
      res.status(200).json(issue);
    } else {
      res.status(404).json({ message: 'Issue not found' });
    }
  } catch (error) {
    console.error('Error getting issue by key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Updates an existing issue.
 * @param {Request} req - The Express request object.  The request body should contain the updated issue data.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 * Responses:
 * - 200 OK: Successfully updated the issue. Returns the updated issue object.
 * - 400 Bad Request: If the request body is invalid or missing required fields, or attempts to update forbidden fields like `id` or `key`. Returns an appropriate error message.
 * - 404 Not Found: If the issue to update is not found. Returns `{ message: 'Issue not found' }`.
 * - 500 Internal Server Error: An error occurred on the server side. Returns `{ message: 'Internal server error' }`.
 */
export const updateIssueEndpoint = async (req: Request, res: Response): Promise<void> => {
  // Use top-level constant for allowed statuses
  // const allowedStatuses = ["Todo", "In Progress", "Done"]; // Removed duplicate definition
  try {
    const { id } = req.params; // Assuming the ID is passed as a route parameter
    const updateData = req.body;

    // Basic validation for existence and non-empty strings
    if (updateData.status !== undefined && !allowedStatuses.includes(updateData.status)) {
         res.status(400).json({ message: `Invalid status: "${updateData.status}". Must be one of ${allowedStatuses.join(', ')}.` });
         return;
    }

    // Fetch the existing issue
    let db: DbSchema;
    try {
      db = await loadDatabase();
    } catch (error) {
      console.error('Error loading database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const issueIndex = db.issues.findIndex(issue => issue.id === id);
    if (issueIndex === -1) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Ensure that key and id are not updated.
    if (updateData.key !== undefined || updateData.id !== undefined) {
      return res.status(400).json({ message: 'Cannot update issue key or id' });
    }

    // Perform the update
    db.issues[issueIndex] = { ...db.issues[issueIndex], ...updateData, updatedAt: new Date().toISOString() };
    try {
      await saveDatabase(db);
    } catch (error) {
      console.error('Error saving database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(db.issues[issueIndex]);

  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Deletes an issue.
 * @param {Request} req - The Express request object. The request must include the issue ID as a route parameter.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 * Responses:
 * - 204 No Content: Successfully deleted the issue.
 * - 404 Not Found: Issue not found. Returns `{ message: 'Issue not found' }`.
 * - 500 Internal Server Error: An error occurred on the server side. Returns `{ message: 'Internal server error' }`.
 */
export const deleteIssueEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let db: DbSchema;
    try {
      db = await loadDatabase();
    } catch (error) {
      console.error('Error loading database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    const issueIndex = db.issues.findIndex(issue => issue.id === id);
    if (issueIndex === -1) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    db.issues.splice(issueIndex, 1);
    try {
      await saveDatabase(db);
    } catch (error) {
      console.error('Error saving database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(204).send(); // No content on success
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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
  return db.issues.find(issue => issue.id === id);
};

/**
 * Helper function to retrieve an issue by its key directly from the database.
 * @param {string} key - The key of the issue to retrieve.
 * @returns {Promise<AnyIssue | undefined>} - A Promise that resolves with the issue object if found, otherwise undefined.
 */
export const getIssueByKey = async (key: string): Promise<AnyIssue | undefined> => {
  const db = await loadDatabase();
  return db.issues.find(issue => issue.key === key);
};

// Note: The addIssue function, IssueCreationError class, and errorStatusCodeMap
// were previously defined here but have been moved to issueService.ts or models.ts
// to keep controller file smaller and separate concerns.
// They are imported at the top if needed.
