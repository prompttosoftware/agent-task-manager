import express from 'express';
import { issueController } from '../controllers/issue.controller';
import { validateIssueKey } from '../controllers/issue.validation';

const router = express.Router();

router.get('/:issueKey', validateIssueKey, issueController.getIssue);
router.post('/:issueKey/attachments', validateIssueKey, issueController.addAttachment);

export default router;