// src/api/routes/issue.routes.ts
import express from 'express';
import { IssueController } from '../controllers/issue.controller';
import validate from '../../middleware/boardValidation';
import { createIssueSchema, getIssueSchema, updateIssueSchema, deleteIssueSchema } from '../validators/issue.validator';

const router = express.Router();

export function issueRoutes(issueController: IssueController) {
  router.post('/', validate(createIssueSchema), issueController.createIssue.bind(issueController));
  router.get('/:id', validate(getIssueSchema), issueController.getIssue.bind(issueController));
  router.put('/:id', validate(updateIssueSchema), issueController.updateIssue.bind(issueController));
  router.delete('/:id', validate(deleteIssueSchema), issueController.deleteIssue.bind(issueController));

  return router;
}
