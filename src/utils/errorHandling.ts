// src/utils/errorHandling.ts

/**
 * Custom error class for errors that occur during issue creation or processing.
 * Includes an optional error code for more specific handling in the consumer.
 */
export class IssueCreationError extends Error {
  errorCode?: IssueErrorCodes | string; // Allow string in case service sends an unknown code
  statusCode?: number; // Add statusCode for direct HTTP response mapping

  constructor(message: string, errorCode?: IssueErrorCodes | string, statusCode?: number) {
    super(message);
    this.name = 'IssueCreationError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    // Set the prototype explicitly. See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, IssueCreationError.prototype);
  }
}

/**
 * Defines specific error codes that can be used with IssueCreationError.
 */
export enum IssueErrorCodes {
  // Validation errors
  MISSING_TITLE = 'MISSING_TITLE', // Required title is missing or empty
  INVALID_ISSUE_TYPE = 'INVALID_ISSUE_TYPE', // Provided issue type is not allowed
  INVALID_STATUS = 'INVALID_STATUS', // Provided status is not allowed
  INVALID_PARENT_KEY = 'INVALID_PARENT_KEY', // Invalid or missing parent key (e.g., for Subtasks) or parent key provided for non-subtask
  PARENT_ISSUE_NOT_FOUND = 'PARENT_ISSUE_NOT_FOUND', // Parent issue specified by key not found
  INVALID_PARENT_TYPE = 'INVALID_PARENT_TYPE', // Cannot parent a Subtask under another Subtask, or an Epic/Bug under anything
  // Authorization/Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED', // User does not have necessary permissions
  // Data access or internal errors
  DATABASE_ERROR = 'DATABASE_ERROR', // General database/data store error
  CONFLICT = 'CONFLICT', // Resource conflict (e.g., issue already exists - though less likely with key generation)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE', // External service dependency is unavailable or unresponsive
  // Generic errors
  INVALID_INPUT = 'INVALID_INPUT', // Generic service-side input validation failure
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR', // Unexpected internal server error not covered by specific codes
}

/**
 * Maps IssueCreationError error codes to HTTP status codes.
 * This map is used by the controller to determine the appropriate HTTP response status.
 */
export const errorStatusCodeMap: { [key in IssueErrorCodes]: number } = {
  [IssueErrorCodes.MISSING_TITLE]: 400,
  [IssueErrorCodes.INVALID_ISSUE_TYPE]: 400,
  [IssueErrorCodes.INVALID_STATUS]: 400,
  [IssueErrorCodes.INVALID_PARENT_KEY]: 400,
  [IssueErrorCodes.PARENT_ISSUE_NOT_FOUND]: 404,
  [IssueErrorCodes.INVALID_PARENT_TYPE]: 400,
  [IssueErrorCodes.PERMISSION_DENIED]: 403, // Added mapping for new code
  [IssueErrorCodes.DATABASE_ERROR]: 500,
  [IssueErrorCodes.CONFLICT]: 409,
  [IssueErrorCodes.SERVICE_UNAVAILABLE]: 503, // Added mapping for new code
  [IssueErrorCodes.INVALID_INPUT]: 400,
  [IssueErrorCodes.INTERNAL_SERVER_ERROR]: 500, // Added mapping for new code
};
