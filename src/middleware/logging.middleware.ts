import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    }, 'Request completed');
  });

  next();
};
