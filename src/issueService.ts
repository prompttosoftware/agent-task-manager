import { loadDatabase, saveDatabase, DB_FILE_PATH } from './database/database'; // Import database functions and constant
import { DbSchema, AnyIssue, BaseIssue, Task, Story, Bug, Epic, Subtask } from './models'; // Import types from models
import { v4 as uuidv4 } from 'uuid'; // Import uuid generator
// Import IssueCreationError and IssueErrorCodes from utils
import { IssueCreationError, IssueErrorCodes } from './utils/errorHandling';
import logger from './utils/logger'; // Import shared logger
import * as keyGenerator from './utils/keyGenerator'; // Import keyGenerator service

/**
 * Define the input type for creating an issue.
 * This specifies the data required from the caller to create a new issue.
 * Moved outside the function to be accessible in the function signature.
 */
interface IssueInput {
  title: string;
  description?: string; // Description is optional based on AnyIssue
  issueTypeName?: string; // Optional type for the issue
  parentKey?: string | null; // Optional reference to a parent issue key
  // Add other properties required for issue creation, excluding internal ones like key or fixed initial status.
}


/**
 * Helper function to retrieve an issue by its key from a *provided* database object.
 * This function is internal to issueService to avoid repeated database loads.
 * @param {DbSchema} db - The database object.
 * @param {string} key - The key of the issue to retrieve.
 * @returns {AnyIssue | undefined} - The issue object if found, otherwise undefined.
 */
const getIssueByKeyInternal = (db: DbSchema, key: string): AnyIssue | undefined => {
  return db.issues.find(issue => issue.key === key);
};

// Export a function to get an issue by key for external use, which handles loading the database.
// Note: This is a separate function from the internal helper used during creation.
export const getIssueByKey = async (key: string): Promise<AnyIssue | undefined> => {
    logger.info('getIssueByKey: Loading database...'); // Add logging before load
    const db = await loadDatabase();
    return getIssueByKeyInternal(db, key); // Corrected second argument from db to key
}


/**
 * Creates a new issue in the database.
 * It generates a unique key and id, sets initial properties based on input
 * and AnyIssue interface requirements, adds the issue to the database,
 * updates the key counter, and saves the database.
 *
 * @param input - An object containing the initial properties for the new issue (e.g., title, description, type, parentKey).
 * @returns A promise that resolves with the newly created issue object, adhering to the AnyIssue interface.
 * @throws {IssueCreationError} If validation fails or a required parent is missing/invalid.
 * @throws {Error} If any database operation fails during the process.
 */
export async function createIssue(input: IssueInput): Promise<AnyIssue> {
  // --- Logging - Start ---
  logger.info('createIssue: Starting issue creation process', { input });
  // --- Logging - End ---

  let db: DbSchema;
  let parentIssue: AnyIssue | undefined; // Declare parentIssue variable outside try block

  try {
    // --- Validation (Synchronous and Requires DB) ---
    // Validate required input fields (synchronous)
    // Add logging before checking title
    logger.info('createIssue: Validating issue title...');
    if (!input.title || input.title.trim().length === 0) {
      // --- Logging - Start ---
      // Update logging to include error code
      logger.warn('createIssue: Validation failed - Missing or empty title', { input, errorCode: IssueErrorCodes.MISSING_TITLE });
      // Log before throwing error
      logger.error('createIssue: Throwing IssueCreationError due to missing or empty title', { errorCode: IssueErrorCodes.MISSING_TITLE });
      // --- Logging - End ---
      throw new IssueCreationError('Issue title is required.', IssueErrorCodes.MISSING_TITLE, 400); // Use imported error class and code
    }

    // Add logging before determining/validating issue type
    logger.info('createIssue: Validating issue type name...');
    let issueType: AnyIssue['issueType'];
    const inputTypeName = input.issueTypeName; // Get the input string
    const normalizedIssueTypeName = inputTypeName?.toLowerCase(); // Normalize for matching

    // Define the set of explicitly allowed input names (including aliases)
    const allowedTypeNames = ['task', 'story', 'feature', 'epic', 'bug', 'subtask'];

    if (inputTypeName !== undefined && inputTypeName !== null && inputTypeName.trim().length > 0) {
      // Input was provided, validate it
      if (!allowedTypeNames.includes(normalizedIssueTypeName || '')) { // Check if normalized name is in the allowed list
        // --- Logging - Start ---
        logger.warn('createIssue: Validation failed - Invalid issueTypeName', { issueTypeName: inputTypeName, errorCode: IssueErrorCodes.INVALID_ISSUE_TYPE });
        logger.error('createIssue: Throwing IssueCreationError due to invalid issueTypeName', { errorCode: IssueErrorCodes.INVALID_ISSUE_TYPE });
        // --- Logging - End ---
        throw new IssueCreationError(`Invalid issue type name: '${inputTypeName}'. Allowed types are: ${allowedTypeNames.join(', ')}.`, IssueErrorCodes.INVALID_ISSUE_TYPE, 400);
      }

      // Input is valid, determine the internal issueType enum value
      switch (normalizedIssueTypeName) {
        case 'task': issueType = 'Task'; break;
        case 'story':
        case 'feature': issueType = 'Story'; break; // Allow 'feature' as an alias for 'Story'
        case 'epic': issueType = 'Epic'; break;
        case 'bug': issueType = 'Bug'; break;
        case 'subtask': issueType = 'Subtask'; break;
        // Default case is not needed here because we already validated against allowedTypeNames
        default: // Should not be reached
           logger.error('createIssue: Internal error - Failed to map valid issueTypeName to enum', { issueTypeName: inputTypeName, normalizedIssueTypeName, errorCode: IssueErrorCodes.INTERNAL_ERROR });
           throw new IssueCreationError('Internal error determining issue type from valid input.', IssueErrorCodes.INTERNAL_ERROR, 500);
      }
    } else {
      // input.issueTypeName was not provided or was empty, default to 'Task'
      logger.info('createIssue: issueTypeName not provided, defaulting to Task');
      issueType = 'Task';
    }


    // Load the database *once* at the beginning if any operation requires it (like parent validation or saving).
    // We must load it if issueType is Subtask to validate parent, or always if we plan to save.
    // Since successful creation *always* saves, we can load it unconditionally here.
    // --- Logging - Start ---
    logger.info('createIssue: Loading database...');
    // --- Logging - End ---
    db = await loadDatabase();
    // --- Logging - Start ---
    logger.info('createIssue: Database loaded successfully.');
    // --- Logging - End ---

    // --- General Parent Existence Validation (Requires DB) ---
    // Check if a parentKey was provided in the input.
    if (input.parentKey) {
        // Validate that the parent issue exists using the already loaded database
        parentIssue = getIssueByKeyInternal(db, input.parentKey); // Use internal helper and assign to parentIssue variable
        if (!parentIssue) {
            // --- Logging - Start ---
            logger.warn('createIssue: Validation failed - Parent not found', { parentKey: input.parentKey });
            // --- Logging - End ---
            // Use the correct error code constant
            throw new IssueCreationError(`Parent issue with key '${input.parentKey}' not found.`, IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, 404);
        }
        // Note: parentIssue is now guaranteed to exist if input.parentKey was provided.
        // We store the found parent in the `parentIssue` variable for potential later use (like type checks).
    }
    // --- End General Parent Existence Validation ---


    // --- Parent Validation Logic for Subtasks (Requires DB) ---
    if (issueType === 'Subtask') {
      // Subtasks require a parentKey
      // We already checked if parentKey exists and the parent issue is found above.
      // So, for Subtasks, we only need to ensure a parentKey was *provided*.
      // The check `!input.parentKey || input.parentKey.trim().length === 0` covers this.
      if (!input.parentKey || input.parentKey.trim().length === 0) { // This check is still necessary for Subtasks specifically
        // --- Logging - Start ---
        logger.warn('createIssue: Validation failed - Missing parentKey for subtask', { input });
        // --- Logging - End ---
        throw new IssueCreationError('Subtask creation requires a parentKey.', IssueErrorCodes.INVALID_PARENT_KEY, 400); // Use imported error class and code
      }

      // Validate that the parent is a valid type (Epic or Story)
      // We can safely access parentIssue here because the block above guarantees its existence if input.parentKey is present.
      // And the check just above guarantees input.parentKey is present for Subtasks.
      // Add null check for parentIssue for type safety, although logic implies it's defined here.
      if (parentIssue) { // Add check here
        // Current logic: Parent must be Epic OR Story. Throw if NEITHER Epic NOR Story.
        if (parentIssue.issueType !== 'Epic' && parentIssue.issueType !== 'Story') { // Use parentIssue variable
          // --- Logging - Start ---
          // Accessing parentIssue.issueType and parentIssue.key is safe inside this if(parentIssue) block.
          logger.warn('createIssue: Validation failed - Invalid parent type', { parentKey: input.parentKey, parentType: parentIssue.issueType });
          // --- Logging - End ---
           throw new IssueCreationError(`Issue with key '${parentIssue.key}' has type '${parentIssue.issueType}', which cannot be a parent of a Subtask. Only Epic or Story issues can be parents of Subtasks.`, IssueErrorCodes.INVALID_PARENT_TYPE, 400);
        }
      }
    }
    // --- End Parent Validation ---

    // --- Logic to create issue object ---
    // This logic depends on validated input and potentially the loaded database state (for parent)
    // --- Logging - Start ---
    logger.info('createIssue: Generating issue key', { issueType });
    // --- Logging - End ---
    // Note: keyGenerator is async, but depends on db.issueKeyCounter which is now inside the try
    const newIssueKey = await keyGenerator.generateIssueKey(db.issueKeyCounter, issueType); // Async step
    // --- Logging - Start ---
    logger.info('createIssue: Issue key generated successfully', { newIssueKey });
    // --- Logging - End ---
    db.issueKeyCounter += 1;


    // 3. Create a new issue object adhering to AnyIssue
    const now = new Date();
    const newIssueId = uuidv4(); // Generate a unique UUID for id

    // Add logging before processing description (validation placeholder)
    // Note: Specific validation rules for description (e.g., max length) are not provided in the requirements,
    // but logging is added here before the description is incorporated into the issue object.
    logger.info('createIssue: Processing description...', { descriptionProvided: input.description !== undefined && input.description !== null });
    // Add description validation here if specific rules are needed (e.g., max length)
    // if (input.description !== undefined && input.description !== null && input.description.length > MAX_DESCRIPTION_LENGTH) {
    //    logger.warn('createIssue: Validation failed - Description exceeds max length', { inputDescriptionLength: input.description.length, errorCode: IssueErrorCodes.DESCRIPTION_TOO_LONG });
    //    logger.error('createIssue: Throwing IssueCreationError due to description exceeding max length', { errorCode: IssueErrorCodes.DESCRIPTION_TOO_LONG });
    //    throw new IssueCreationError('Description exceeds maximum allowed length.', IssueErrorCodes.DESCRIPTION_TOO_LONG, 400);
    // }


    // Determine initial status based on the mapped issueType, ensuring it's one of the allowed types ('Todo', 'In Progress', 'Done').
    // Status logic should be handled by the service, not passed from the controller input.
    let status: AnyIssue['status'];
    if (issueType === 'Bug') {
        status = 'In Progress'; // Bug issues start as 'In Progress'
    } else {
        status = 'Todo'; // All other issue types (Task, Story, Epic, Subtask) start as 'Todo'
    }

    // Construct the base issue object, strictly adhering to the BaseIssue interface properties.
    // This includes all required fields from BaseIssue.
    const baseIssue: BaseIssue = {
      id: newIssueId, // UUID generated for the issue
      key: newIssueKey, // Unique key derived from the counter
      projectKey: 'PROJ', // TODO: Determine project key dynamically
      issueType: issueType, // Determined issue type
      summary: input.title, // Issue title from input, mapped to summary (Input uses title, models use summary)
      description: input.description || '', // Optional description from input, default to ''
      status: status, // Initial status determined based on issue type
      createdAt: now.toISOString(), // Timestamp of creation (ISO string)
      updatedAt: now.toISOString(), // Timestamp of last update (initially same as createdAt)
      parentKey: input.parentKey ?? null, // Optional parent issue key from input, ensure null or undefined becomes null
    };

    // Add type-specific properties based on the determined issueType,
    // ensuring the final object adheres to the specific concrete interface (Task, Story, Epic, Bug, Subtask)
    // and thus the AnyIssue union type.
    let newIssue: AnyIssue;

    if (issueType === 'Epic') {
      newIssue = {
        ...baseIssue,
        issueType: 'Epic', // Explicitly set for type narrowing
        childIssueKeys: [], // Epics start with no children
      } as Epic; // Cast to Epic type to satisfy interface
    } else if (issueType === 'Subtask') {
      // Subtasks require a parentIssueKey which must come from input.parentKey
      // Validation for existence and parent type is done above.
       if (!input.parentKey) {
           // This case should have been caught by the validation above, but keeping it for type safety/redundancy.
           throw new IssueCreationError('Internal Error: Missing parentKey for Subtask after validation.', IssueErrorCodes.INTERNAL_ERROR, 500); // Use constant
       }
      newIssue = {
        ...baseIssue,
        issueType: 'Subtask', // Explicitly set for type narrowing
        // parentIssueKey: input.parentKey, // REMOVED: parentKey is already included from spreading baseIssue
      } as Subtask; // Cast to Subtask type to satisfy interface
    } else {
      // Task, Story, Bug issues only have BaseIssue properties (plus optional description/parentKey)
      // Cast to AnyIssue to be safe, although it should implicitly fit Task/Story/Bug which extend BaseIssue
      // Ensure parentKey is handled - BaseIssue already includes parentKey? | null
      newIssue = baseIssue as Task | Story | Bug;
    }

    // 4. Add the new issue to the issues array in the database
    db.issues.push(newIssue);


    // --- Logic to update parent issue's childIssueKeys and updatedAt ---
    // This happens *after* the new issue is added to the db.issues array.
    // Check if a parentKey was provided in the input.
    // We already looked up parentIssue earlier if input.parentKey was provided.
    // Use the stored parentIssue variable.
    if (parentIssue) { // Check if parentIssue variable was set (meaning input.parentKey was provided and parent was found)
        // Check if the found parent is an Epic (only Epics have childIssueKeys)
        // Use a type guard or cast to ensure we can access childIssueKeys
        if (parentIssue.issueType === 'Epic') { // Use the parentIssue variable
             const parentEpicInDb = parentIssue as Epic; // Cast for type safety - parentIssue is already the object from db

            // Add the new issue's key to the parent's childIssueKeys array
            // Ensure the array exists first (should exist based on Epic model, but safety check)
            if (!parentEpicInDb.childIssueKeys) {
                 parentEpicInDb.childIssueKeys = [];
            }
            parentEpicInDb.childIssueKeys.push(newIssue.key); // Use the new issue's key

            // Update the parent's updatedAt timestamp to the current time
            parentEpicInDb.updatedAt = newIssue.updatedAt; // Use the timestamp generated for the new issue
        }
         // If parentIssue isn't an Epic, we don't track children on non-Epic parents
         // based on the current model, so no further action needed for the parent here.
    }
    // --- End Logic to update parent issue's childIssueKeys and updatedAt ---


    // 5. Increment issueKeyCounter in the database (Done above)

    // 6. Save the updated database
    // This save will now include both the new subtask and the modified parent (if applicable).
    // --- Logging - Start ---
    logger.info('createIssue: Saving database', { issueKey: newIssue.key });
    // --- Logging - End ---
    await saveDatabase(db); // Async step
    // --- Logging - Start ---
    logger.info('createIssue: Database saved successfully', { issueKey: newIssue.key });
    // --- Logging - End ---

    // 7. Return the newly created issue
    // --- Logging - Start ---
    logger.info('createIssue: Issue created successfully', { issueKey: newIssue.key });
    // --- Logging - End ---
    return newIssue;

  } catch (error) {
    // --- Logging - Start ---
    logger.error('createIssue: Error during issue creation', { error });
    // --- Logging - End ---

    // Re-throw the specific error if it's an IssueCreationError,
    // otherwise wrap unexpected errors in a generic Error or specific database error.
    if (error instanceof IssueCreationError) {
        throw error; // Re-throw validation/specific errors
    }
    // Throw a generic error for unexpected issues, e.g., database write failures.
    // Use the original error's message if available, otherwise a generic one.
    // Also use a generic error code constant for unexpected errors if defined.
    throw new Error(`Failed to create issue: ${error instanceof Error ? error.message : 'An unexpected error occurred.'}`); // Provide more context or the original error message
  }
}
