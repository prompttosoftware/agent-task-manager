import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  errorMessages: string[];
  errors?: { [key: string]: string };
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const errorMessages: string[] = err.message ? [err.message] : ['Internal Server Error'];
  const errors = err.errors || {};

  const response: ErrorResponse = {
    errorMessages,
    errors,
  };

  res.status(statusCode).json(response);
};

export default errorHandler;