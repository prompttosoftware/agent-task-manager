import { z } from 'zod';
/**
 * Represents a generic issue, often corresponding to an item in an issue tracking system.
 * Contains core details necessary to identify and describe an issue.
 */
export interface Issue {
  /**
   * The type of the issue (e.g., Bug, Task, Story, Epic).
   * Helps categorize the issue. Must be a non-empty string.
   * @example 'Bug'
   * @example 'Story'
   */
  issuetype: string;
  /**
   * A brief summary or title of the issue.
   * Must be a non-empty string.
   * @example 'Login button unresponsive on Safari'
   */
  summary: string;
  /**
   * A detailed description of the issue, including steps to reproduce, context, etc.
   * Must be a non-empty string.
   * @example 'When a user clicks the login button on Safari version 15.1, nothing happens. Expected behavior is redirection to the dashboard.'
   */
  description: string;
  /**
   * Optional key of the parent issue, if this issue is a sub-task or part of a larger item (like an Epic).
   * Can be a string, null, or undefined.
   * @example 'PROJECT-123' // Parent Epic key
   * @example null // No parent
   */
  parentKey?: string | null;
  /**
   * A human-readable unique identifier for the issue, often used in project management tools (e.g., JIRA key).
   * Must be a non-empty string.
   * @example 'PROJECT-456'
   */
  key: string;
  /**
   * Unique identifier for the issue, often assigned by the underlying data store (e.g., MongoDB ObjectId).
   * Must be a non-empty string.
   * @example '60c72b2f9b1e8a5a4d8b4567'
   */
  _id: string;

}

/**
 * Zod schema for validating Issue objects.
 * Ensures that required string fields are non-empty.
 */
export const IssueSchema = z.object({
  _id: z.string().min(1, { message: "_id cannot be empty" }),
  issuetype: z.string().min(1, { message: "issuetype cannot be empty" }),
  summary: z.string().min(1, { message: "summary cannot be empty" }),
  description: z.string().min(1, { message: "description cannot be empty" }),
  parentKey: z.string().nullable().optional(), // Allows string, null, or undefined
  key: z.string().min(1, { message: "key cannot be empty" }),
});

/**
 * Validates an object against the IssueSchema.
 * Throws a ZodError if validation fails.
 *
 * @param data - The object to validate.
 * @returns The validated Issue object.
 * @throws {ZodError} If validation fails.
 */
export function validateIssue(data: unknown): Issue {
    try {
      // Attempt to parse and validate the data using the Zod schema
      const validatedIssue = IssueSchema.parse(data);
      // Ensure the validated data conforms to the Issue interface structure,
      // although Zod's parse already effectively does this if the schema matches the interface.
      // This assertion is more for TypeScript's benefit.
      return validatedIssue as Issue;
    } catch (error) {
      // Re-throw the ZodError for detailed validation failure information
      if (error instanceof z.ZodError) {
        // Optional: Log the error details here if needed
        // console.error("Issue validation failed:", error.errors);
      }
      // Re-throw the original error (likely a ZodError)
      throw error;
    }
  }