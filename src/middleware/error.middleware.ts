// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  // TODO: Customize error responses based on error type and requirements
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
};
