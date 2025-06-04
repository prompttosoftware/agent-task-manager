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
