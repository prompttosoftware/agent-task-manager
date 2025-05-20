import { AnyIssue } from './anyIssue'; // Corrected import path

/**
 * Represents the structure of the entire database storage.
 * It contains an array of issues and a counter for generating issue keys.
 */
export interface DbSchema {
  /**
   * An array containing all issues stored in the database.
   */
  issues: AnyIssue[];
  /**
   * A counter used to generate unique keys for new issues.
   */
  issueKeyCounter: number;
}
