/**
 * @file Defines the CustomError class for handling application-specific errors
 * with status codes and optional detailed error objects.
 */

/**
 * Interface for the optional 'errors' object within CustomError.
 * Allows for structured error details.
 * Using `Record<string, unknown>` provides type safety over `any`.
 */
export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * CustomError class extends the built-in Error class to include
 * an HTTP-like status code and an optional object for more detailed errors.
 *
 * @param {string} message - The error message.
 * @param {number} statusCode - An HTTP status code or application-specific error code.
 * @param {ErrorDetails} [errors] - Optional. An object containing detailed error information.
 */
export class CustomError extends Error {
  statusCode: number;
  errors?: ErrorDetails;

  constructor(message: string, statusCode: number, errors?: ErrorDetails) {
    // Call the parent Error constructor
    super(message);

    // Assign custom properties
    this.statusCode = statusCode;
    this.errors = errors;

    // Set the prototype explicitly. This is important for instanceof checks
    // when extending built-in classes like Error in some environments.
    Object.setPrototypeOf(this, CustomError.prototype);

    // Set the error name to the class name
    this.name = this.constructor.name;

    // Capture the stack trace, excluding the constructor call (if available, V8 specific)
    // Error.captureStackTrace?.(this, this.constructor);
  }
}

// Example of how to use it (optional, for demonstration):
/*
try {
  throw new CustomError("User validation failed", 400, {
    email: "Email is already taken",
    password: "Password must be at least 8 characters long"
  });
} catch (error) {
  if (error instanceof CustomError) {
    console.error(`Status Code: ${error.statusCode}`);
    console.error(`Message: ${error.message}`);
    if (error.errors) {
      console.error(`Details: ${JSON.stringify(error.errors, null, 2)}`);
    }
    // console.error(error.stack);
  } else if (error instanceof Error) {
    console.error(`Generic Error: ${error.message}`);
    // console.error(error.stack);
  } else {
    console.error("An unknown error occurred:", error);
  }
}
*/