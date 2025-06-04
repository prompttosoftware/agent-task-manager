import { Request, Response, NextFunction } from 'express';

// Define a custom error interface to include a status code
interface CustomError extends Error {
  statusCode?: number;
}

/**
 * Error handling middleware.
 * @param err The error object.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware function.
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500; // Default to 500 (Internal Server Error)
  const message = err.message || 'Internal Server Error';

  console.error(err); // Log the error for debugging

  res.status(statusCode).json({
    message,
    statusCode,
  });
};
