import { loadDatabase, saveDatabase, DbSchema, AnyIssue } from './dataStore';
import { v4 as uuidv4 } from 'uuid'; // Import uuid generator

// Define a custom error class for issue creation errors
class IssueCreationError extends Error {
  errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = 'IssueCreationError';
    this.errorCode = errorCode;
    // Set the prototype explicitly. See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, IssueCreationError.prototype);
  }
}


// Define the input type for creating an issue.
// This specifies the data required from the caller to create a new issue.
interface IssueInput {
  title: string;
  description?: string; // Description is optional based on AnyIssue
  issueTypeName?: string; // Optional type for the issue
  parentKey?: string | null; // Optional reference to a parent issue key
  // Add other properties required for issue creation, excluding internal ones like key or fixed initial status.
}

/**
 * Creates a new issue in the database.
 * It generates a unique key and id, sets initial properties based on input
 * and AnyIssue interface requirements, adds the issue to the database,
 * updates the key counter, and saves the database.
 *
 * @param input - An object containing the initial properties for the new issue (e.g., title, description, type).
 * @returns A promise that resolves with the newly created issue object, adhering to the AnyIssue interface.
 * @throws {Error} If any database operation fails during the process.
 */
export async function createIssue(input: IssueInput): Promise<AnyIssue> {
  // Validate required input fields
  if (!input.title || input.title.trim().length === 0) {
    throw new IssueCreationError('Issue title is required.', 'MISSING_TITLE');
  }

  try {
    // 1. Load the database
    const db: DbSchema = await loadDatabase();

    // 2. Generate a new issue key by incrementing issueKeyCounter
    const newIssueKeyCounter = db.issueKeyCounter + 1;
    // Format the counter into a unique key string, e.g., "ISSUE-1", "ISSUE-2", etc.
    const newIssueKey = `ISSUE-${newIssueKeyCounter}`;

    // 3. Create a new issue object adhering to AnyIssue
    const now = new Date();
    const newIssueId = uuidv4(); // Generate a unique UUID for id

    // Map issueTypeName from input to AnyIssue['issueType'], ensuring it's one of the allowed types.
    let issueType: AnyIssue['issueType'];
    switch (input.issueTypeName) {
      case 'Task':
        issueType = 'Task';
        break;
      case 'Story':
      case 'feature': // Allow 'feature' as an alias for 'Story'
        issueType = 'Story';
        break;
      case 'Epic':
        issueType = 'Epic';
        break;
      case 'Bug':
        issueType = 'Bug';
        break;
      case 'Subtask':
        issueType = 'Subtask';
        break;
      default:
        issueType = 'Task'; // Default to 'Task' if input type is unrecognized or not provided
    }

    // Determine initial status based on the mapped issueType, ensuring it's one of the allowed types ('Todo', 'In Progress', 'Done').
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
      issueType: issueType, // Determined issue type
      summary: input.title, // Issue title from input, mapped to summary
      description: input.description, // Optional description from input
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
      if (!input.parentKey) {
        throw new IssueCreationError('Subtask creation requires a parentKey.', 'INVALID_PARENT_KEY');
      }
      newIssue = {
        ...baseIssue,
        issueType: 'Subtask', // Explicitly set for type narrowing
        parentIssueKey: input.parentKey, // Required for Subtasks
      } as Subtask; // Cast to Subtask type to satisfy interface
    } else {
      // Task, Story, Bug issues only have BaseIssue properties (plus optional description/parentKey)
      // Cast to AnyIssue to be safe, although it should implicitly fit Task/Story/Bug which extend BaseIssue
      newIssue = baseIssue as Task | Story | Bug;
    }

    // 4. Add the new issue to the issues array in the database
    db.issues.push(newIssue);

    // 5. Increment issueKeyCounter in the database
    db.issueKeyCounter = newIssueKeyCounter;

    // 6. Save the updated database
    await saveDatabase(db);

    // 7. Return the newly created issue
    return newIssue;

  } catch (error) {
    // Log the error internally for debugging purposes
    console.error('Error creating issue:', error);
    // Re-throw a standardized error message or the original error
    throw new Error('Failed to create issue due to a data storage error.');
  }
}
