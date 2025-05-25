import { Request, Response } from 'express';
import { AnyIssue } from '../../models';
import { addIssue, getNextIssueKey } from '../../dataStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new issue based on the provided request body.
 *
 * The request body is expected to contain the following fields:
 * - `issueType` (string, required): The type of the issue. Must be one of "Task", "Story", "Epic", "Bug", "Subtask".
 * - `summary` (string, required): A concise summary of the issue. Cannot be empty.
 * - `status` (string, required): The current status of the issue. Must be one of "Todo", "In Progress", "Done".
 * - `description` (string, optional): A detailed description of the issue. Defaults to an empty string if not provided.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 *
 * Responses:
 * - 201 Created: Successfully created the issue. Returns the created issue object in the response body.
 * - 400 Bad Request:
 *   - If `issueType`, `summary`, or `status` are missing or empty: `{ message: 'Missing required fields: issueType, summary, and status are required.' }`
 *   - If `issueType` is invalid: `{ message: 'Invalid issueType: "..." Must be one of Task, Story, Epic, Bug, Subtask.' }`
 *   - If `status` is invalid: `{ message: 'Invalid status: "..." Must be one of Todo, In Progress, Done.' }`
 * - 500 Internal Server Error: An error occurred on the server side, likely related to data store operations (getting key, adding issue). Returns `{ message: 'Internal server error' }`.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  const allowedIssueTypes = ["Task", "Story", "Epic", "Bug", "Subtask"];
  const allowedStatuses = ["Todo", "In Progress", "Done"];

  try {
    const { issueType, summary, status, description } = req.body;

    // Basic validation for existence and non-empty strings
    if (!issueType || !summary || !status || issueType.trim() === '' || summary.trim() === '' || status.trim() === '') {
      res.status(400).json({ message: 'Missing required fields: issueType, summary, and status are required.' });
      return;
    }

    // Validate issueType and status against allowed values from models.ts
    if (!allowedIssueTypes.includes(issueType)) {
         res.status(400).json({ message: `Invalid issueType: "${issueType}". Must be one of ${allowedIssueTypes.join(', ')}.` });
         return;
    }

    if (!allowedStatuses.includes(status)) {
         res.status(400).json({ message: `Invalid status: "${status}". Must be one of ${allowedStatuses.join(', ')}.` });
         return;
    }

    const { parentIssueKey } = req.body;
    // Validate parentIssueKey for Subtasks if issueType is Subtask
    if (issueType === 'Subtask' && (!parentIssueKey || typeof parentIssueKey !== 'string' || parentIssueKey.trim() === '')) {
      res.status(400).json({ message: 'Missing required field: parentIssueKey is required for Subtasks.' });
      return; // Stop execution here
    }

    // Generate required fields
    const id = uuidv4();
    const key = getNextIssueKey();
    const now = new Date().toISOString();

    // Create the new issue object with base properties
    const baseIssue = {
      id: id,
      key: key,
      issueType: issueType as AnyIssue["issueType"], // Cast validated string to union type
      summary: summary,
      description: description || '', // Use provided description or default to empty string
      status: status as AnyIssue["status"], // Cast validated string to union type
      createdAt: now,
      updatedAt: now,
    };

    let newIssue: AnyIssue;

    // Handle specific properties based on issueType
    switch (issueType) {
      case "Epic":
        newIssue = {
          ...baseIssue,
          childIssueKeys: [], // Requirement 1: Epics must have childIssueKeys: []
        };
        break;
      case "Subtask":
        const { parentIssueKey } = req.body; // parentIssueKey was already validated before generating ID/Key
        newIssue = {
          ...baseIssue,
          parentIssueKey: parentIssueKey.trim(), // Add parentIssueKey
        };
        break;
      case "Task":
      case "Story":
      case "Bug":
      default: // Should not happen due to validation, but handles simple types
        newIssue = baseIssue;
        break;
    }

    // Requirement 4: Ensure the created issue object correctly matches the type definition.
    // The switch statement above constructs the object based on the specific type.
    // TypeScript will verify that the structure assigned to `newIssue` is compatible with `AnyIssue`.

    // Add to data store
    addIssue(newIssue);

    // Respond with the created issue object
    res.status(201).json(newIssue);

  } catch (error) {
    console.error('Error creating issue:', error); // Log the error for debugging
    // This catch block handles potential errors from uuidv4(), getNextIssueKey(), addIssue()
    res.status(500).json({ message: 'Internal server error' });
  }
};
