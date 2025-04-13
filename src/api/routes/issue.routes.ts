import { Router } from 'express';
import * as issueController from '../controllers/issue.controller';

const router = Router();

// GET /boards/:boardId/issues
router.get('/boards/:boardId/issues', issueController.getIssuesForBoard);

// GET /issues/:issueKey
router.get('/issues/:issueKey', issueController.getIssue);

// POST /issues
router.post('/issues', issueController.addIssue);

// PUT /issues/:issueKey
router.put('/issues/:issueKey', issueController.updateIssue);

// DELETE /issues/:issueKey
router.delete('/issues/:issueKey', issueController.deleteIssue);

// GET /issues/search
router.get('/issues/search', issueController.searchIssues);

// GET /issue/createmeta
router.get('/issue/createmeta', issueController.getIssueCreateMetadata);

export default router;
