// src/routes.ts
import { Router } from 'express';
import { IssueController } from './controllers/issue.controller';
import { WebhookController } from './controllers/webhook.controller';

const router = Router();

const issueController = new IssueController();
const webhookController = new WebhookController();

router.post('/issues', issueController.createIssue);
router.get('/issues/:id', issueController.getIssueById);
router.put('/issues/:id', issueController.updateIssue);
router.delete('/issues/:id', issueController.deleteIssue);

router.post('/webhooks', webhookController.handleWebhook);

export { router as routes };
