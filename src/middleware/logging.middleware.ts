import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'],
      requestId: req.id,
    }, 'request completed');
  });

  logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    requestId: req.id,
  }, 'incoming request');

  next();
};

export default loggingMiddleware;
