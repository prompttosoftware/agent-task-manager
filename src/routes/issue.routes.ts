import express from 'express';
import { IssueController } from '../controllers/issue.controller';
import { IssueService } from '../services/issue.service';

const router = express.Router();
const issueService = new IssueService();
const issueController = new IssueController(issueService);

router.post('/rest/api/2/issue', issueController.create.bind(issueController));
router.get('/rest/api/2/issue/:issueKey', issueController.findByKey.bind(issueController));
router.delete('/rest/api/2/issue/:issueKey', issueController.delete.bind(issueController));

export default router;
