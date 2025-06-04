import { AnyIssue } from '../models/BaseIssue'; // Assuming AnyIssue is defined in a types file

/**
 * Represents the overall structure of the database schema.
 */
export interface DbSchema {
  /**
   * An array containing all issues in the database.
   */
  issues: AnyIssue[];
  /**
   * A counter used to generate unique keys for new issues.
   */
  issueKeyCounter: number;
}

// Initialize the database state
export const dbState: DbSchema = {
  issues: [],
  issueKeyCounter: 0,
};

// Function to simulate saving the database (in-memory for now)
export const saveDb = async (data: DbSchema): Promise<void> => {
  // In a real application, this would write to a file or database
  // For now, we just log the data to the console.
  console.log("Saving database:", data);
};
