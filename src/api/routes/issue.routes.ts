// src/api/routes/issue.routes.ts
import express from 'express';
import { body } from 'express-validator';
import * as issueController from '../controllers/issue.controller';

const router = express.Router();

router.post(
  '/issues',
  [ // Add validation middleware here
    body('summary').notEmpty().withMessage('Summary is required'),
    body('description').optional(),
    body('issueType').notEmpty().withMessage('Issue type is required'),
    body('project').notEmpty().withMessage('Project is required'),
    // Add more validations as needed
  ],
  issueController.addIssue
);

export default router;