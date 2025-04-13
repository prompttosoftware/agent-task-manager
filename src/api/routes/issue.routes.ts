import express from 'express';
import { createIssue, updateIssueController, deleteIssueController, assignIssue, searchIssues } from '../controllers/issue.controller';

const router = express.Router();

router.post('/', createIssue);
router.put('/:issueKey', updateIssueController);
router.delete('/:issueKey', deleteIssueController);
router.patch('/:issueKey/assign', assignIssue);
router.get('/search', searchIssues); // Add the search route

export default router;