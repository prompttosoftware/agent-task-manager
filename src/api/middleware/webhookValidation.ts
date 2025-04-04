import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';

export const validateWebhookRegistration = [
  check('url')
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Invalid URL'),
  check('events')
    .isArray({ min: 1 })
    .withMessage('Events must be an array with at least one element')
    .notEmpty()
    .withMessage('Events is required')
    .custom((value: string[]) => {
      const validEvents = ['issue.created', 'issue.updated', 'issue.deleted'];
      for (const event of value) {
        if (!validEvents.includes(event)) {
          return false; // Invalid event found
        }
      }
      return true; // All events are valid
    })
    .withMessage('Invalid event type(s). Allowed values are: issue.created, issue.updated, issue.deleted'),
  check('active')
    .notEmpty()
    .withMessage('Active status is required')
    .isBoolean()
    .withMessage('Active must be a boolean'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];