import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const { method, url } = req;
    const statusCode = res.statusCode;

    logger.info({
      method,
      url,
      statusCode,
      responseTime,
    }, `${method} ${url}`);
  });

  next();
};

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement actual authentication logic
  console.warn('Authentication middleware is a placeholder!');
  next();
};

export { authenticate };
export default loggingMiddleware;
