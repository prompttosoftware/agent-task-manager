import { Issue } from '../models/issue';
import { v4 as uuidv4 } from 'uuid';
import { loadDatabase, saveDatabase } from '../db/persistence'; // Import persistence functions
import { generateIssueKey } from '../utils/issueKeyGenerator'; // Import key generator
import { AnyIssue } from '../models/anyIssue'; // Import AnyIssue for type compatibility with DbSchema

export interface IssueCreationData {
    projectKey: string;
    issueTypeId: string;
    summary: string;
    description?: string;
    parentKey?: string;
}

/**
 * Creates a new issue and persists it to the database.
 * @param data - The data required to create the issue.
 * @returns A promise that resolves with the newly created issue object.
 */
export const createIssue = async (data: IssueCreationData): Promise<Issue> => {
  // 1. Load the current database state
  const db = await loadDatabase();

  // 2. Generate a unique issue key and increment the counter
  const newCounter = db.issueKeyCounter + 1;
  const issueKey = generateIssueKey(data.issueTypeId, newCounter);

  // 3. Create the new issue object
  // A common base structure is sufficient for this task based on models and task description.
  const newIssue: AnyIssue = { // Cast to AnyIssue to match the DbSchema storage type
      id: uuidv4(), // Generate a unique ID
      key: issueKey,
      // Use a relative path for the self URL. This is standard practice for API responses.
      self: `/rest/api/2/issue/${issueKey}`,
      fields: {
          project: { key: data.projectKey },
          issuetype: { id: data.issueTypeId }, // Using issue type ID as per JIRA API
          summary: data.summary,
          description: data.description,
          // Add default values for common fields required by the Issue interface or API spec
          status: { id: '1', name: 'To Do' }, // Default initial status for new issues
          created: new Date().toISOString(), // Set creation timestamp
          updated: new Date().toISOString(), // Set update timestamp
      }
  };

    // Set parent issue key if provided
    if (data.parentKey) {
        // @ts-ignore - parentKey does not exist in the general issue type, but should be set on the subtask
        newIssue.parentIssueKey = data.parentKey;
    }

  // 4. Add the new issue to the database and update the counter
  db.issues.push(newIssue);
  db.issueKeyCounter = newCounter;

  // 5. Save the updated database state
  await saveDatabase(db);

  // 6. Return the newly created issue
  // The newIssue object conforms to the Issue interface.
  return newIssue;
};
