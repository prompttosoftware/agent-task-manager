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
   * A counter to generate unique keys for new issues.
   */
  issueKeyCounter: number;

  /**
   * The timestamp when the database was last updated (ISO 8601 string).
   */
  lastUpdated: string;
}
