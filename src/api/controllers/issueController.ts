import { Request, Response } from 'express';
import { AnyIssue, DbSchema } from '../../models';
import { loadDatabase, saveDatabase } from '../../dataStore';
import { v4 as uuidv4 } from 'uuid';

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
  // Use top-level constants for allowed types and statuses
  // const allowedIssueTypes = ["Task", "Story", "Epic", "Bug", "Subtask"]; // Removed duplicate definition
  // const allowedStatuses = ["Todo", "In Progress", "Done"]; // Removed duplicate definition

  try {
    const { issueType, summary, status, description } = req.body;

    // Basic validation for existence and non-empty strings
    if (!issueType || !summary || !status || issueType.trim() === '' || summary.trim() === '' || status.trim() === '') {
      res.status(400).json({ message: 'Missing required fields: issueType, summary, and status are required.' });
      return;
    }

    // Validate issueType and status against allowed values
    // The following checks already ensure issueType and status are valid before proceeding.
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

    let db: DbSchema;
    try {
      db = await loadDatabase();
    } catch (error) {
      console.error('Error loading database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    // Generate required fields
    const id = uuidv4();
    const nextCounter = db.issueKeyCounter + 1; // Calculate the next counter value
    const key = generateIssueKey(issueType, nextCounter); // Use the new function
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
        // These types do not require additional properties beyond baseIssue
        newIssue = baseIssue;
        break;
      default: // Handle unknown issue types by throwing an error
        // This case should theoretically not be reached if the validation above is correct,
        // but it's a good safety net.
        throw new Error(`Internal Error: Unhandled issue type "${issueType}" encountered.`);
    }

    // Requirement 4: Ensure the created issue object correctly matches the type definition.
    // The switch statement above constructs the object based on the specific type.
    // TypeScript will verify that the structure assigned to `newIssue` is compatible with `AnyIssue`.

    // Add to data store
    db.issues.push(newIssue);
    db.issueKeyCounter = nextCounter; // Update the counter to the value used for the key

    try {
      await saveDatabase(db);
    } catch (error) {
      console.error('Error saving database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    res.status(201).json(newIssue);

  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Internal server error' });
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
 * - 400 Bad Request: If the request body is invalid or missing required fields. Returns an appropriate error message.
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
    if (updateData.status && !allowedStatuses.includes(updateData.status)) {
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

/**
 * Helper function to add a new issue directly to the database.
 * Handles ID, key, and timestamp generation.
 * @param {object} issueData - The data for the new issue (excluding generated fields).
 * @param {"Task" | "Story" | "Epic" | "Bug" | "Subtask"} issueData.issueType - The type of the issue.
 * @param {string} issueData.summary - The summary of the issue.
 * @param {string} [issueData.description] - The description of the issue.
 * @param {"Todo" | "In Progress" | "Done"} issueData.status - The status of the issue.
 * @param {string} [issueData.parentIssueKey] - The parent issue key (required for Subtask).
 * @returns {Promise<AnyIssue>} - A Promise that resolves with the created issue object.
 */
export const addIssue = async (issueData: { issueType: AnyIssue['issueType']; summary: string; description?: string; status: AnyIssue['status']; parentIssueKey?: string; }): Promise<AnyIssue> => {
  // Add validation for required fields: issueType, summary, and status
  if (!issueData.issueType || issueData.issueType.trim() === '' || !issueData.summary || issueData.summary.trim() === '' || !issueData.status || issueData.status.trim() === '') {
    throw new Error('Missing required fields: issueType, summary, and status are required.');
  }

  // Add validation for issueType against allowed values
  if (!allowedIssueTypes.includes(issueData.issueType)) {
      throw new Error(`Invalid issueType: "${issueData.issueType}". Must be one of ${allowedIssueTypes.join(', ')}.`);
  }

  // Add validation for status against allowed values
   if (!allowedStatuses.includes(issueData.status)) {
      throw new Error(`Invalid status: "${issueData.status}". Must be one of ${allowedStatuses.join(', ')}.`);
  }

  // Add validation for parentIssueKey if issueType is Subtask
  if (issueData.issueType === 'Subtask' && (!issueData.parentIssueKey || typeof issueData.parentIssueKey !== 'string' || issueData.parentIssueKey.trim() === '')) {
       throw new Error('Missing required field: parentIssueKey is required for Subtasks.');
  }


  const db = await loadDatabase();

  // Generate required fields
  const id = uuidv4();
  const nextCounter = db.issueKeyCounter + 1; // Calculate the next counter value
  const key = generateIssueKey(issueData.issueType, nextCounter); // Use the new function
  const now = new Date().toISOString();

  // Create the new issue object with base properties
  const baseIssue = {
    id: id,
    key: key,
    issueType: issueData.issueType,
    summary: issueData.summary,
    description: issueData.description || '', // Use provided description or default to empty string
    status: issueData.status,
    createdAt: now,
    updatedAt: now,
  };

  let newIssue: AnyIssue;

  // Handle specific properties based on issueType
  switch (issueData.issueType) {
    case "Epic":
      newIssue = {
        ...baseIssue,
        childIssueKeys: [], // Requirement 1: Epics must have childIssueKeys: []
      };
      break;
    case "Subtask":
      // parentIssueKey is required for Subtask based on the type definition
      // Assuming issueData provides it, although validation isn't done here
      newIssue = {
        ...baseIssue,
        parentIssueKey: issueData.parentIssueKey!, // Add parentIssueKey (non-null assertion assuming input type is correct)
      };
      break;
    case "Task":
    case "Story":
    case "Bug":
      newIssue = baseIssue;
      break;
    default: // Handle unknown issue types by throwing an error
       // This case should theoretically not be reached if the validation above is correct,
       // but it's a good safety net.
       // The default case already handles throwing an error for an unknown issue type,
       // indicating the type in the message.
       throw new Error(`Internal Error: Unhandled issue type "${issueData.issueType}" encountered in addIssue.`);
  }

  // Add to data store
  db.issues.push(newIssue);
  db.issueKeyCounter = nextCounter; // Update the counter to the value used for the key

  await saveDatabase(db);

  return newIssue;
};


/**
 * Helper function to update an existing issue by its ID directly in the database.
 * @param {string} id - The ID of the issue to update.
 * @param {Partial<AnyIssue>} updateData - The partial issue data to update.
 * @returns {Promise<AnyIssue | undefined>} - A Promise that resolves with the updated issue object if found, otherwise undefined.
 */
export const updateIssue = async (id: string, updateData: Partial<AnyIssue>): Promise<AnyIssue | undefined> => {
  const db = await loadDatabase();

  const issueIndex = db.issues.findIndex(issue => issue.id === id);

  if (issueIndex === -1) {
    return undefined; // Issue not found
  }

  // Prevent updating immutable fields (key, id, createdAt)
  const allowedUpdates = { ...updateData };
  delete allowedUpdates.id;
  delete allowedUpdates.key;
  delete allowedUpdates.createdAt;
  // Ensure issueType and parentIssueKey are also not updated via update (typically they are immutable)
  delete allowedUpdates.issueType; // Prevent issueType update
  if (db.issues[issueIndex].issueType === 'Subtask') {
      delete allowedUpdates.parentIssueKey;
  }
   // childIssueKeys for Epics is also typically managed separately or not allowed to be overwritten directly
  if (db.issues[issueIndex].issueType === 'Epic') {
      // You might want to handle adding/removing child keys specifically,
      // but preventing direct overwrite of the array via Partial<AnyIssue> is safer.
      delete allowedUpdates.childIssueKeys;
  }


  // Merge updates, preserving original object identity where possible or creating new one
  const updatedIssue = {
    ...db.issues[issueIndex],
    ...allowedUpdates, // Apply allowed updates
    updatedAt: new Date().toISOString(), // Update timestamp
  };

  // Ensure the updated object conforms to the specific issue type if necessary
  // Although the spread operator usually handles this, it's good to be aware.
  // If specific type properties were passed in allowedUpdates they will be merged.

  db.issues[issueIndex] = updatedIssue as AnyIssue; // Cast back to AnyIssue type

  await saveDatabase(db);

  return db.issues[issueIndex]; // Return the updated issue from the array
};

/**
 * Helper function to delete an issue by its ID directly from the database.
 * @param {string} id - The ID of the issue to delete.
 * @returns {Promise<boolean>} - A Promise that resolves with true if the issue was found and deleted, otherwise false.
 */
export const deleteIssue = async (id: string): Promise<boolean> => {
  const db = await loadDatabase();

  const issueIndex = db.issues.findIndex(issue => issue.id === id);

  if (issueIndex === -1) {
    return false; // Issue not found
  }

  db.issues.splice(issueIndex, 1);

  await saveDatabase(db);

  return true; // Issue found and deleted
};
