import { v4 as uuidv4 } from 'uuid';
import { AnyIssue, BaseIssue, Epic, Subtask } from '../models/BaseIssue';
// Assuming a db module exists that manages the state and provides save functionality
import { dbState, saveDb } from '../db/db'; // Adjust path based on actual db module location

// Define an interface for the input data to create an issue
interface CreateIssueData {
  issueTypeName: BaseIssue['issueType'];
  summary: string;
  description?: string;
  // Specific properties for certain types
  childIssueKeys?: string[]; // For Epic
  parentIssueKey?: string; // For Subtask
  // Add other potential input fields here
}

export class IssueService {
  /**
   * Creates a new issue in the database.
   *
   * @param issueData - The data for the new issue. Must include issueTypeName and summary.
   * @returns A promise that resolves with the created issue object.
   * @throws Error if input data is invalid or a database error occurs.
   */
  async createIssue(issueData: CreateIssueData): Promise<AnyIssue> {
    try {
      // 1. Validate input
      if (!issueData.issueTypeName || !issueData.summary) {
        throw new Error("Issue type and summary are required.");
      }

      // 2. Load the database (assuming dbState is accessible after import/initialization)
      // No explicit load needed if dbState is managed by the imported module

      // 3. Generate a unique key
      // Assuming issueKeyCounter is managed within the dbState
      dbState.issueKeyCounter++; // Increment counter
      const issueKey = `ISSUE-${dbState.issueKeyCounter}`; // Using 'ISSUE' as a default project prefix

      // 4. Generate unique ID
      const issueId = uuidv4();

      // 5. Set timestamps and default status
      const now = new Date().toISOString();
      const defaultStatus: BaseIssue['status'] = "Todo"; // Using "Todo" as the default initial status

      // 6. Create the base issue object
      const baseIssue: BaseIssue = {
        id: issueId,
        key: issueKey,
        issueType: issueData.issueTypeName,
        summary: issueData.summary,
        description: issueData.description,
        status: defaultStatus,
        createdAt: now,
        updatedAt: now, // Set updated at same as created at initially
      };

      // 7. Instantiate the appropriate issue type and add specific properties
      let newIssue: AnyIssue;

      switch (issueData.issueTypeName) {
        case "Epic":
          newIssue = {
            ...baseIssue,
            childIssueKeys: issueData.childIssueKeys || [], // Initialize with empty array if not provided
          } as Epic; // Type assertion
          break;
        case "Subtask":
           if (!issueData.parentIssueKey) {
               throw new Error("Subtask issues require a parentIssueKey.");
           }
          newIssue = {
            ...baseIssue,
            parentIssueKey: issueData.parentIssueKey,
          } as Subtask; // Type assertion
          break;
        case "Task":
        case "Story":
        case "Bug":
          newIssue = baseIssue; // These types don't have specific properties defined in BaseIssue.ts
          break;
        default:
          // Handle unknown issue types
          throw new Error(`Unknown issue type: ${issueData.issueTypeName}`);
      }

      // 8. Save the new issue to the database
      dbState.issues.push(newIssue);

      // 9. Persist the database state
      // Assuming saveDb() is an async function that saves the dbState
      await saveDb(dbState);

      // 10. Return the created issue
      return newIssue;

    } catch (error: any) {
      console.error("Error creating issue:", error);
      // Re-throw the error or throw a custom service-level error
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  // async getIssueById(issueId: string): Promise<any | null> {
  //   // Implementation to retrieve an issue
  //   return null;
  // }

  // async updateIssue(issueId: string, updateData: any): Promise<any | null> {
  //   // Implementation to update an issue
  //   return null;
  // }

  // async deleteIssue(issueId: string): Promise<boolean> {
  //   // Implementation to delete an issue
  //   return false;
  // }
}
