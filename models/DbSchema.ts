import { AnyIssue } from './BaseIssue';

/**
 * Represents the structure of the application's database schema.
 */
export interface DbSchema {
  /**
   * An array containing all issues in the database.
   */
  issues: AnyIssue[];

  /**
   * A counter used to generate unique issue keys.
   */
  issueKeyCounter: number;
}
