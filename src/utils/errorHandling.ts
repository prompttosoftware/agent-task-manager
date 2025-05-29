// src/utils/errorHandling.ts

/**
 * Custom error class for errors that occur during issue creation or processing.
 * Includes an optional error code for more specific handling in the consumer.
 */
export class IssueCreationError extends Error {
  errorCode?: string;
  statusCode?: number; // Add statusCode for direct HTTP response mapping

  constructor(message: string, errorCode?: string, statusCode?: number) {
    super(message);
    this.name = 'IssueCreationError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    // Set the prototype explicitly. See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, IssueCreationError.prototype);
  }
}

/**
 * Maps IssueCreationError error codes to HTTP status codes.
 * This map is used by the controller to determine the appropriate HTTP response status.
 */
export const errorStatusCodeMap: { [errorCode: string]: number } = {
  // Validation errors
  'MISSING_TITLE': 400,         // Required title is missing or empty
  'INVALID_ISSUE_TYPE': 400,    // Provided issue type is not allowed
  'INVALID_STATUS': 400,        // Provided status is not allowed
  'INVALID_PARENT_KEY': 400,    // Invalid or missing parent key (e.g., for Subtasks)
  'PARENT_NOT_FOUND': 404,      // Parent issue specified by key not found
  'PARENT_IS_SUBTASK': 400,     // Cannot parent a Subtask under another Subtask
  'EPIC_HAS_SUBTASK_PARENT': 400, // Epic cannot have a Subtask parent
  // Data access or internal errors
  'DATABASE_ERROR': 500,        // General database/data store error
  // Add other specific error codes and their corresponding status codes as needed
};
