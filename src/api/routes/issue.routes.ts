import express from 'express';
import { IssueController } from '../controllers/issue.controller';
import { issueValidator } from '../validators/issue.validator';

const router = express.Router();

router.get('/:issueKey', issueValidator.validateIssueKey(), IssueController.getIssue);

router.post('/', issueValidator.validateIssueData(), IssueController.createIssue);

router.put('/:issueKey', issueValidator.validateIssueKey(), issueValidator.validateIssueData(), IssueController.updateIssue);

router.delete('/:issueKey', issueValidator.validateIssueKey(), IssueController.deleteIssue);

router.put('/:issueKey/assignee', issueValidator.validateIssueKey(), issueValidator.validateAssignee(), IssueController.updateAssignee);

export default router;