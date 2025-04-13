import { body, ValidationChain } from 'express-validator';

export const addIssueValidator: ValidationChain[] = [
  body('summary')
    .isString()
    .withMessage('Summary must be a string')
    .notEmpty()
    .withMessage('Summary is required'),

  body('description')
    .isString()
    .withMessage('Description must be a string')
    .optional(),

  body('issueType')
    .isString()
    .withMessage('Issue type must be a string')
    .notEmpty()
    .withMessage('Issue type is required')
    .isIn(['Bug', 'Task', 'Story'])
    .withMessage('Issue type must be one of: Bug, Task, Story'),
];