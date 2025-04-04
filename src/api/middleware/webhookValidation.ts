// src/api/middleware/webhookValidation.ts

import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';

export const validateWebhookRegistration = [
  check('event')
    .notEmpty()
    .withMessage('Event is required')
    .isIn(['issue.created', 'issue.updated', 'issue.deleted'])
    .withMessage('Invalid event type'),
  check('url')
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Invalid URL'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];