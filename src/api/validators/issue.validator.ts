// src/api/validators/issue.validator.ts
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Status } from '../types/issue';
import { z } from 'zod';

const issueSchema = z.object({
  summary: z.string().min(3).max(255),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  boardId: z.string().uuid(),
});

export const issueValidator = {
  validateIssueKey: (): ValidationChain[] => [
    param('issueKey').isString().withMessage('Issue key must be a string').notEmpty().withMessage('Issue key cannot be empty'),
  ],

  validateIssueData: (): ValidationChain[] => [
    body('summary').isString().withMessage('Summary must be a string').notEmpty().withMessage('Summary cannot be empty').isLength({ min: 3, max: 255 }).withMessage('Summary must be between 3 and 255 characters'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('status').isString().withMessage('Status must be a string').isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status value'),
    body('boardId').isUUID().withMessage('Board ID must be a UUID'),
  ],

  validateTransitionIssueData: (): ValidationChain[] => [
    body('transition').isString().withMessage('Transition must be a string').notEmpty().withMessage('Transition cannot be empty'),
  ],

  validateAttachment: (): ValidationChain[] => [
    // Assuming a basic file upload structure
    param('issueKey').isString().withMessage('Issue key must be a string').notEmpty().withMessage('Issue key cannot be empty'),
    body('filename').isString().withMessage('Filename must be a string').notEmpty().withMessage('Filename cannot be empty'),
    body('file').notEmpty().withMessage('File must be present'), // Assuming multer or similar middleware handles the file upload
  ],

  validateIssueLinkData: (): ValidationChain[] => [
    body('inwardIssue').isString().withMessage('Inward issue must be a string').notEmpty().withMessage('Inward issue cannot be empty'),
    body('outwardIssue').isString().withMessage('Outward issue must be a string').notEmpty().withMessage('Outward issue cannot be empty'),
    body('linkType').isString().withMessage('Link type must be a string').notEmpty().withMessage('Link type cannot be empty'),
  ],

  validateAssignee: (): ValidationChain[] => [
    body('assigneeId').isString().withMessage('Assignee ID must be a string').notEmpty().withMessage('Assignee ID cannot be empty'),
  ],

  validateSearchIssues: (): ValidationChain[] => [
    query('query').isString().withMessage('Query must be a string').notEmpty().withMessage('Query cannot be empty'),
    query('status').optional().isString().withMessage('Status must be a string').isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status value'),
    query('boardId').optional().isUUID().withMessage('Board ID must be a UUID')
  ],

  validateDeleteIssue: (): ValidationChain[] => [
    param('issueKey').isString().withMessage('Issue key must be a string').notEmpty().withMessage('Issue key cannot be empty')
  ]
};
