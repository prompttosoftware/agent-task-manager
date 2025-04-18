import express from 'express';
import { issueController } from '../controllers/issueController';

const router = express.Router();

router.post('/link', issueController.linkIssues);
router.post('/', issueController.createIssue);
router.get('/search', issueController.searchIssues);
router.get('/:issueIdOrKey', issueController.getIssue);

export default router;