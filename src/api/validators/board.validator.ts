import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateBoard = [
  body('name').notEmpty().withMessage('Board name is required').isString().withMessage('Board name must be a string').trim().escape(),
  body('description').optional().isString().withMessage('Description must be a string').trim().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
