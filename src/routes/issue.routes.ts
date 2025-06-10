import { Router } from 'express';
import { IssueController } from '../api/issue.controller'; // Assuming the controller is in api/issue.controller.ts
import upload from '../../middleware/upload.config';

const router = Router();
const issueController = new IssueController();

router.post('/rest/api/2/issue', issueController.createIssue);
router.get('/rest/api/2/issue/:issueKey', issueController.getIssue);
router.delete('/rest/api/2/issue/:issueKey', issueController.deleteIssue);
router.post('/rest/api/2/issue/:issueKey/attachments', upload.array('file'), issueController.addAttachment);

export default router;
