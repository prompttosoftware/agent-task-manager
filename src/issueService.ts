import { v4 as uuidv4 } from 'uuid'; // Import uuid generator

import { loadDatabase, saveDatabase } from './database/database'; // Import database functions
// DB_FILE_PATH is not directly used in this file, so it can be removed if not needed for other reasons (e.g. re-export, though not the case here)
// For now, let's assume it might be intended for future use or was overlooked. If strictly minimal, keep it.
// Minimal change: keep it but ensure consistency.
// Correcting my thought: DB_FILE_PATH is not used. Remove it.
// import { loadDatabase, saveDatabase, DB_FILE_PATH } from './database/database'; // Import database functions and constant
import { AnyIssue, BaseIssue, Bug, DbSchema, Epic, Story, Subtask, Task } from './models'; // Import types from models, sorted
import { IssueCreationError, IssueErrorCodes } from './utils/errorHandling'; // Import IssueCreationError and IssueErrorCodes from utils
import * as keyGenerator from './utils/keyGenerator'; // Import keyGenerator service
import logger from './utils/logger'; // Import shared logger

/**
 * Define the input type for creating an issue.
 * This specifies the data required from the caller to create a new issue.
 * Moved outside the function to be accessible in the function signature.
 */
interface IssueInput {
  title: string;
  description?: string; // Description is optional
  issueTypeName?: string; // Optional type name for the issue
  parentKey?: string | null; // Optional reference to a parent issue's key
  // Other properties required for issue creation, excluding internal ones like key or fixed initial status.
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
  logger.info("getIssueByKey: Loading database..."); // Add logging before load
  const db = await loadDatabase();
  return getIssueByKeyInternal(db, key);
};

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
  logger.info("createIssue: Starting issue creation process", { input });
  // --- Logging - End ---

  let db: DbSchema;
  let parentIssue: AnyIssue | undefined; // Declare parentIssue variable outside try block

  try {
    // --- Validation (Synchronous and Requires DB) ---
    // Validate required input fields (synchronous)
    // Add logging before checking title
    logger.info("createIssue: Validating issue title...");
    if (!input.title || input.title.trim().length === 0) {
      // --- Logging - Start ---
      // Update logging to include error code
      logger.warn("createIssue: Validation failed - Missing or empty title", {
        input,
        errorCode: IssueErrorCodes.MISSING_TITLE,
      });
      // Log before throwing error
      logger.error("createIssue: Throwing IssueCreationError due to missing or empty title", {
        errorCode: IssueErrorCodes.MISSING_TITLE,
      });
      // --- Logging - End ---
      throw new IssueCreationError("Issue title is required.", IssueErrorCodes.MISSING_TITLE, 400); // Use imported error class and code
    }

    // Add logging before determining/validating issue type
    logger.info("createIssue: Validating issue type name...");
    let issueType: AnyIssue["issueType"];
    const inputTypeName = input.issueTypeName; // Get the input string
    const normalizedIssueTypeName = inputTypeName?.trim().toLowerCase(); // Normalize for matching

    // Define the set of explicitly allowed input names (including aliases)
    const allowedTypeNames = ["task", "story", "feature", "epic", "bug", "subtask"];

    if (inputTypeName && inputTypeName.trim().length > 0) {
      // Input was provided and is not empty, validate it
      if (!allowedTypeNames.includes(normalizedIssueTypeName || "")) {
        // Check if normalized name is in the allowed list
        // --- Logging - Start ---
        logger.warn("createIssue: Validation failed - Invalid issueTypeName", {
          issueTypeName: inputTypeName,
          errorCode: IssueErrorCodes.INVALID_ISSUE_TYPE,
        });
        logger.error("createIssue: Throwing IssueCreationError due to invalid issueTypeName", {
          errorCode: IssueErrorCodes.INVALID_ISSUE_TYPE,
        });
        // --- Logging - End ---
        throw new IssueCreationError(
          `Invalid issue type name: '${inputTypeName}'. Allowed types are: ${allowedTypeNames.join(", ")}.`,
          IssueErrorCodes.INVALID_ISSUE_TYPE,
          400,
        );
      }

      // Input is valid, determine the internal issueType enum value
      switch (normalizedIssueTypeName) {
        case "task":
          issueType = "Task";
          break;
        case "story":
        case "feature": // 'feature' is an alias for 'Story'
          issueType = "Story";
          break;
        case "epic":
          issueType = "Epic";
          break;
        case "bug":
          issueType = "Bug";
          break;
        case "subtask":
          issueType = "Subtask";
          break;
        // Default case is not strictly needed due to prior validation against allowedTypeNames
        default: // Should not be reached if validation is correct
          logger.error("createIssue: Internal error - Failed to map valid issueTypeName to enum", {
            issueTypeName: inputTypeName,
            normalizedIssueTypeName,
            errorCode: IssueErrorCodes.INTERNAL_ERROR,
          });
          throw new IssueCreationError(
            "Internal error determining issue type from valid input.",
            IssueErrorCodes.INTERNAL_ERROR,
            500,
          );
      }
    } else {
      // input.issueTypeName was not provided or was empty, default to 'Task'
      logger.info("createIssue: issueTypeName not provided or empty, defaulting to Task");
      issueType = "Task";
    }

    // Load the database *once* at the beginning if any operation requires it (like parent validation or saving).
    // Since successful creation *always* saves, we load it unconditionally here.
    // --- Logging - Start ---
    logger.info("createIssue: Loading database...");
    // --- Logging - End ---
    db = await loadDatabase();
    // --- Logging - Start ---
    logger.info("createIssue: Database loaded successfully.");
    // --- Logging - End ---

    // --- General Parent Existence Validation (Requires DB) ---
    // Check if a parentKey was provided in the input.
    if (input.parentKey) {
      // Validate that the parent issue exists using the already loaded database
      parentIssue = getIssueByKeyInternal(db, input.parentKey); // Use internal helper
      if (!parentIssue) {
        // --- Logging - Start ---
        logger.warn("createIssue: Validation failed - Parent not found", { parentKey: input.parentKey });
        // --- Logging - End ---
        throw new IssueCreationError(
          `Parent issue with key '${input.parentKey}' not found.`,
          IssueErrorCodes.PARENT_ISSUE_NOT_FOUND,
          404,
        );
      }
      // Note: parentIssue is now guaranteed to exist if input.parentKey was provided and valid.
    }
    // --- End General Parent Existence Validation ---

    // --- Parent Validation Logic for Subtasks (Requires DB) ---
    if (issueType === "Subtask") {
      // Subtasks require a parentKey.
      // The check `!input.parentKey || input.parentKey.trim().length === 0` covers this.
      if (!input.parentKey || input.parentKey.trim().length === 0) {
        // --- Logging - Start ---
        logger.warn("createIssue: Validation failed - Missing parentKey for subtask", { input });
        // --- Logging - End ---
        throw new IssueCreationError("Subtask creation requires a parentKey.", IssueErrorCodes.INVALID_PARENT_KEY, 400);
      }

      // Parent must exist for Subtasks (already checked by general parent validation if parentKey was provided).
      // If parentIssue is not defined here, it means input.parentKey was provided but the parent was not found,
      // which should have thrown PARENT_ISSUE_NOT_FOUND.
      // For robustness, ensure parentIssue is defined before checking its type.
      if (!parentIssue) {
        // This state implies input.parentKey was set, but the parent wasn't found.
        // This specific error case should ideally be caught by the PARENT_ISSUE_NOT_FOUND above.
        // Adding this check for defensive programming.
        logger.error("createIssue: Internal inconsistency - parentKey provided for Subtask, but parentIssue not found after initial check.", { parentKey: input.parentKey });
        throw new IssueCreationError(
            `Parent issue with key '${input.parentKey}' not found, which is required for a Subtask.`,
            IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, // Re-iterate the correct error
            404,
        );
      }
      
      // Validate that the parent is a valid type (Epic or Story).
      // parentIssue is guaranteed to be defined here if we reach this point for a Subtask with a parentKey.
      if (parentIssue.issueType !== "Epic" && parentIssue.issueType !== "Story") {
        // --- Logging - Start ---
        logger.warn("createIssue: Validation failed - Invalid parent type for Subtask", {
          parentKey: input.parentKey,
          parentType: parentIssue.issueType,
        });
        // --- Logging - End ---
        throw new IssueCreationError(
          `Issue with key '${parentIssue.key}' has type '${parentIssue.issueType}', which cannot be a parent of a Subtask. Only Epic or Story issues can be parents of Subtasks.`,
          IssueErrorCodes.INVALID_PARENT_TYPE,
          400,
        );
      }
    }
    // --- End Parent Validation ---

    // --- Logic to create issue object ---
    // This logic depends on validated input and potentially the loaded database state (for parent).
    // --- Logging - Start ---
    logger.info("createIssue: Generating issue key", { issueType });
    // --- Logging - End ---
    // Note: keyGenerator.generateIssueKey is synchronous, but it's good practice to await async functions if they were.
    // Here, it's not async, so no await needed for keyGenerator.generateIssueKey itself.
    // db.issueKeyCounter is part of the loaded `db` object.
    const newIssueKey = keyGenerator.generateIssueKey(db.issueKeyCounter, issueType); // Corrected: generateIssueKey is sync
    // --- Logging - Start ---
    logger.info("createIssue: Issue key generated successfully", { newIssueKey });
    // --- Logging - End ---
    db.issueKeyCounter += 1;

    // 3. Create a new issue object adhering to AnyIssue
    const now = new Date();
    const newIssueId = uuidv4(); // Generate a unique UUID for id

    // Add logging before processing description
    logger.info("createIssue: Processing description...", {
      descriptionProvided: !!input.description,
    });
    // Description validation (e.g., max length) could be added here if needed.
    // if (input.description && input.description.length > MAX_DESCRIPTION_LENGTH) {
    //    logger.warn('createIssue: Validation failed - Description exceeds max length', { inputDescriptionLength: input.description.length, errorCode: IssueErrorCodes.DESCRIPTION_TOO_LONG });
    //    throw new IssueCreationError('Description exceeds maximum allowed length.', IssueErrorCodes.DESCRIPTION_TOO_LONG, 400);
    // }

    // Determine initial status based on the mapped issueType.
    let status: AnyIssue["status"];
    if (issueType === "Bug") {
      status = "In Progress"; // Bug issues start as 'In Progress'
    } else {
      status = "Todo"; // All other issue types start as 'Todo'
    }

    // Construct the base issue object.
    const baseIssue: BaseIssue = {
      id: newIssueId,
      key: newIssueKey,
      projectKey: "PROJ", // Default project key
      issueType: issueType,
      summary: input.title, // Mapped from input.title
      description: input.description || "", // Default to empty string if undefined
      status: status,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      parentKey: input.parentKey ?? null, // Ensure null if undefined or null
    };

    // Add type-specific properties.
    let newIssue: AnyIssue;

    if (issueType === "Epic") {
      newIssue = {
        ...baseIssue,
        issueType: "Epic", // Explicitly set for type narrowing
        childIssueKeys: [], // Epics start with no children
      } as Epic;
    } else if (issueType === "Subtask") {
      // Parent key validation for subtask already performed.
      // input.parentKey is guaranteed to be non-null and valid here for a Subtask.
      newIssue = {
        ...baseIssue,
        issueType: "Subtask", // Explicitly set for type narrowing
        // parentKey is already in baseIssue
      } as Subtask;
    } else {
      // For Task, Story, Bug, baseIssue properties are sufficient.
      newIssue = baseIssue as Task | Story | Bug;
    }

    // 4. Add the new issue to the issues array in the database
    db.issues.push(newIssue);

    // --- Logic to update parent issue's childIssueKeys and updatedAt ---
    // This happens *after* the new issue is added to db.issues.
    if (parentIssue) { // parentIssue was found earlier
      if (parentIssue.issueType === "Epic") {
        const parentEpicInDb = parentIssue as Epic; // Cast, as parentIssue is already the object from db.

        // Ensure childIssueKeys array exists (should be guaranteed by Epic model).
        parentEpicInDb.childIssueKeys = parentEpicInDb.childIssueKeys || [];
        parentEpicInDb.childIssueKeys.push(newIssue.key);

        // Update the parent's updatedAt timestamp.
        parentEpicInDb.updatedAt = newIssue.updatedAt; // Use the new issue's creation/update time.
      }
      // No action needed for non-Epic parents regarding childIssueKeys based on current models.
    }
    // --- End Logic to update parent issue's childIssueKeys and updatedAt ---

    // 5. Increment issueKeyCounter in the database (Done above before key generation)

    // 6. Save the updated database
    // --- Logging - Start ---
    logger.info("createIssue: Saving database", { issueKey: newIssue.key });
    // --- Logging - End ---
    await saveDatabase(db);
    // --- Logging - Start ---
    logger.info("createIssue: Database saved successfully", { issueKey: newIssue.key });
    // --- Logging - End ---

    // 7. Return the newly created issue
    // --- Logging - Start ---
    logger.info("createIssue: Issue created successfully", { issueKey: newIssue.key });
    // --- Logging - End ---
    return newIssue;
  } catch (error) {
    // --- Logging - Start ---
    logger.error("createIssue: Error during issue creation", { error });
    // --- Logging - End ---

    if (error instanceof IssueCreationError) {
      throw error; // Re-throw known validation/specific errors
    }
    // Wrap unexpected errors.
    throw new Error(
      `Failed to create issue: ${error instanceof Error ? error.message : "An unexpected error occurred."}`,
    );
  }
}
