// src/api/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';
import { isUUID } from 'validator';

export const validateWebhookCreation = [
  check('url').isURL().withMessage('URL must be a valid URL'),
  check('eventType').notEmpty().withMessage('Event type is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateWebhookId = [
  check('id').isUUID().withMessage('Invalid webhook ID format'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
