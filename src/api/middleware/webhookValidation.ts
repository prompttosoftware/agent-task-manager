// src/api/middleware/webhookValidation.ts
import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';

export const validateWebhookRegister = async (req: Request, res: Response, next: NextFunction) => {
  // Define validation rules for the request body
  await Promise.all([
    body('url').isURL().withMessage('URL must be a valid URL').run(req),
    body('events').isArray().withMessage('Events must be an array').run(req),
    body('events.*').isString().withMessage('Each event must be a string').run(req),
    body('secret').optional().isString().withMessage('Secret must be a string').run(req),
  ]);
  next();
};
