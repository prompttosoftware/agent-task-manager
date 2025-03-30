import { Hono } from 'hono';
import { issueController } from '../controllers/issue.controller';
import { z } from 'zod';

const issueRoutes = new Hono();

const issueKeySchema = z.string().min(1);

issueRoutes.get('/issues/:issueKey', issueController.getIssue);
issueRoutes.delete('/issues/:issueKey', issueController.deleteIssue);
issueRoutes.post('/issues/:issueKey/attachments', issueController.addAttachment);
issueRoutes.post('/issuelinks', issueController.createIssueLink);
issueRoutes.get('/issue/createmeta', issueController.getIssueCreateMetadata);
issueRoutes.get('/issues/:issueKey/transitions', issueController.getIssueTransitions);

export { issueRoutes };