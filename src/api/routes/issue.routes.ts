import { Router } from 'express';
import { issueController } from '../controllers/issue.controller';

const router = Router();

// GET /issues/search
router.get('/issues/search', issueController.searchIssues);

// GET /issues/:issueKey
router.get('/issues/:issueKey', issueController.getIssue);

// GET /boards/:boardId/issues
router.get('/boards/:boardId/issues', issueController.getIssuesByBoard);

// POST /issues
router.post('/issues', issueController.createIssue);

// PUT /issues/:issueKey
router.put('/issues/:issueKey', issueController.updateIssue);

// DELETE /issues/:issueKey
router.delete('/issues/:issueKey', issueController.deleteIssue);

// POST /issues/:issueKey/transitions
router.post('/issues/:issueKey/transitions', issueController.transitionIssue);

// POST /issues/:issueKey/attachments
router.post('/issues/:issueKey/attachments', issueController.addAttachment);

// POST /issuelinks
router.post('/issuelinks', issueController.createIssueLink);

// PUT /issues/:issueKey/assignee
router.put('/issues/:issueKey/assignee', issueController.assignIssue);

// GET /issue/createmeta
router.get('/issue/createmeta', issueController.getCreateIssueMeta);

// GET /issues/:issueKey/transitions
router.get('/issues/:issueKey/transitions', issueController.getIssueTransitions);

export default router;
