import { Request, Response } from 'express';
// Import necessary types from models
import { AnyIssue, DbSchema, CreateIssueInput }
// TODO: Verify if CreateIssueInput should be defined in models.ts based on project structure.
// Assuming it's defined like:
// export interface CreateIssueInput {
//   issueType: AnyIssue['issueType'];
//   summary: string;
//   status: AnyIssue['status'];
//   description?: string;
//   parentIssueKey?: string;
// }
from '../../models';
import { createIssue as createIssueService } from '../../issueService';
import { ApiError } from '../utils/apiError'; // Import ApiError
import { loadDatabase, saveDatabase } from '../../dataStore'; // Import dataStore functions needed for other handlers


// Define allowed values for issue types and statuses - Keep these for controller validation
const allowedIssueTypes = ["Task", "Story", "Epic", "Bug", "Subtask"];
const allowedStatuses = ["Todo", "In Progress", "Done"];


/**
 * Creates a new issue based on the provided request body by calling the issue service.
 *
 * The request body is expected to contain the following fields:
 * - `issueType` (string, required): The type of the issue. Must be one of "Task", "Story", "Epic", "Bug", "Subtask".
 * - `summary` (string, required): A concise summary of the issue. Cannot be empty.
 * - `status` (string, required): The status of the issue. Must be one of "Todo", "In Progress", "Done".
 * - `description` (string, optional): A detailed description of the issue. Defaults to an empty string if not provided.
 * - `parentIssueKey` (string, optional): The key of the parent issue. Required for Subtasks (must be a non-empty string).
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 *
 * Responses:
 * - 201 Created: Successfully created the issue. Returns the created issue object in the response body.
 * - 400 Bad Request: If the request body contains invalid data, such as a missing required field, an invalid value for a field (e.g., `issueType`, `status`), or an invalid/missing `parentIssueKey` for a Subtask. The response body will contain a `message` property detailing the validation error.
 * - 500 Internal Server Error: An unexpected error occurred on the server side or a service error not specifically mapped by ApiError. Returns `{ message: 'Internal server error' }`.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueType, summary, status, description, parentIssueKey } = req.body;

    // Validate required fields
    if (!issueType) {
      res.status(400).json({ message: 'Missing required field: issueType.' });
      return;
    }
    if (!summary) { // Assuming summary cannot be an empty string either, but test only checks for missing.
      res.status(400).json({ message: 'Missing required field: summary.' });
      return;
    }
    if (!status) {
      res.status(400).json({ message: 'Missing required field: status.' });
      return;
    }

    // Validate issueType value
    if (!allowedIssueTypes.includes(issueType)) {
      res.status(400).json({ message: `Invalid value for issueType: ${issueType}. Must be one of: ${allowedIssueTypes.join(', ')}.` });
      return;
    }

    // Validate status value
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: `Invalid value for status: ${status}. Must be one of: ${allowedStatuses.join(', ')}.` });
      return;
    }

    // Validate parentIssueKey for Subtasks
    if (issueType === 'Subtask') {
      if (!parentIssueKey || typeof parentIssueKey !== 'string' || parentIssueKey.trim() === '') {
        res.status(400).json({ message: 'Missing required field: parentIssueKey is required for Subtasks.' });
        return;
      }
    }

    // Prepare input for the service call
    // The service expects an object matching the structure expected by its createIssue function.
    // Based on issueService.ts in action history, it expects { title: string, description?: string, issueTypeName?: string, parentKey?: string | null }.
    // The controller's input { summary, issueType, description, parentIssueKey } needs mapping.
    const serviceInput = {
      title: summary, // map summary from controller input to title for service input
      issueTypeName: issueType, // map issueType from controller input to issueTypeName for service input
      description: description || '', // default to empty string if description is not provided
      // Only pass parentKey if it's a Subtask and was provided, otherwise leave undefined.
      // The service handles the null/undefined logic for parentKey internally.
      parentKey: (issueType === 'Subtask' && parentIssueKey) ? parentIssueKey : undefined,
    };

    // Note: Status is validated here in the controller, but NOT passed to the service,
    // as the service determines the initial status based on issue type.

    const createdIssue = await createIssueService(serviceInput);
    res.status(201).json(createdIssue);

  } catch (error: any) {
    if (error instanceof ApiError && error.statusCode) {
      // If it's a known API error (e.g., from the service), use its status and message
      res.status(error.statusCode).json({ message: error.message });
    } else {
      // For unexpected errors, log them and return a generic 500 error
      console.error('Error creating issue:', error);
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

// getIssueByKey is now provided by the service,
// but this file also uses a local getIssueByKey for some functions.
// To avoid confusion and potential circular dependencies if other parts of the service
// were to call the *controller's* getIssueByKey, and since the other controller
// functions (getIssueByKeyEndpoint, updateIssueEndpoint, deleteIssueEndpoint)
// still seem to be accessing the DB directly and *not* using the service's getIssueByKey,
// I will keep the local getIssueByKey for now.
// The subtask was specifically about *unused* helper functions getIssueKeyPrefix and generateIssueKey.
// This getIssueByKey function *is* used by other functions in this file (getIssueByKeyEndpoint).
// However, the *service* also has a getIssueByKey.
// For consistency, the endpoints should ideally use the service.
// Let's revisit this later. For now, only remove the clearly unused key generation helpers.

/**
 * Helper function to retrieve an issue by its key directly from the database.
 * @param {string} key - The key of the issue to retrieve.
 * @returns {Promise<AnyIssue | undefined>} - A Promise that resolves with the issue object if found, otherwise undefined.
 */
// Keep this local getIssueByKey for now as other endpoint handlers use it.
// TODO: Refactor other endpoints (getIssueByKeyEndpoint, updateIssueEndpoint, deleteIssueEndpoint)
// to use the service layer for database access consistency.
export const getIssueByKey = async (key: string): Promise<AnyIssue | undefined> => {
  const db = await loadDatabase();
  return db.issues.find(issue => issue.key === key);
};

// Note: The addIssue function, IssueCreationError class, and errorStatusCodeMap
// were previously defined here but have been moved to issueService.ts or models.ts
// to keep controller file smaller and separate concerns.
// They are imported at the top if needed.
