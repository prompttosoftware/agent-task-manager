// src/routes.ts
import { Router } from 'express';
import { IssueController } from './controllers/issue.controller';

const router = Router();
const issueController = new IssueController();

// Issue Management Endpoints
router.get('/issue/:issueNumber', issueController.findIssue);
router.get('/board/:boardId/issue', issueController.getIssuesForBoard);
router.post('/issue/:issueKey/transitions', issueController.transitionIssue);
router.post('/issue/:issueKey/attachments', issueController.addAttachment);
router.post('/issueLink', issueController.linkIssues);
router.put('/issue/:issueKey/assignee', issueController.updateAssignee);
router.post('/issue', issueController.addNewIssue);
router.delete('/issue/:issueKey', issueController.deleteIssue);
router.get('/issue/:issueKey/transitions', issueController.listTransitions);
router.get('/issue/createmeta', issueController.getIssueCreateMetadata);

router.get('/', (req, res) => {
  res.send('Hello, World!');
});

export default router;