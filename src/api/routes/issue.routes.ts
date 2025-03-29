import { Hono } from 'hono';
import { issueController } from '../controllers/issue.controller';

const issueRoutes = new Hono();

issueRoutes.get('/issues/:issueKey', issueController.getIssue);
issueRoutes.delete('/issues/:issueKey', issueController.deleteIssue);
issueRoutes.post('/issues/:issueKey/attachments', issueController.addAttachment);
issueRoutes.post('/issuelinks', issueController.createIssueLink);

export { issueRoutes };