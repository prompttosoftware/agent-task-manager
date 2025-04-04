import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@nestjs/common';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.response?.message || [message];

  res.status(statusCode).json({
    statusCode: statusCode,
    message: errors,
    error: 'Internal Server Error',
  });
};
