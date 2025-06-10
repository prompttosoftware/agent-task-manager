import { Router } from 'express';
import { IssueController } from '../api/issue.controller'; // Assuming the controller is in api/issue.controller.ts

const router = Router();
const issueController = new IssueController();

router.post('/rest/api/2/issue', issueController.createIssue);
router.get('/rest/api/2/issue/:issueKey', issueController.getIssue);
router.delete('/rest/api/2/issue/:issueKey', issueController.deleteIssue);

export default router;
