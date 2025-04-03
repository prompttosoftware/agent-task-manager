// src/api/controllers/issue.validation.ts

import { Request, Response } from 'express';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import { IssueStatus } from '../../types/issue';

export const validateCreateIssue = async (req: Request, res: Response) => {
  await Promise.all([
    body('description').notEmpty().withMessage('Description is required').run(req),
  ]);
};

export const validateUpdateIssue = async (req: Request, res: Response) => {
  await Promise.all([
    body('description').notEmpty().withMessage('Description is required').run(req),
    body('status').isIn(Object.values(IssueStatus)).withMessage('Invalid status').run(req),
  ]);
};