// src/routes.ts
import express from 'express';
import { IssueController } from './controllers/issue.controller';
import { WebhookController } from './controllers/webhook.controller';

const router = express.Router();

// Issue routes
const issueController = new IssueController();
router.post('/issues', issueController.createIssue);
router.get('/issues', issueController.getAllIssues);
router.get('/issues/:issueId', issueController.getIssue);
router.put('/issues/:issueId', issueController.updateIssue);

// Webhook routes
const webhookController = new WebhookController();
router.post('/webhook', webhookController.registerWebhook);
router.get('/webhook', webhookController.listWebhooks);
router.delete('/webhook/:webhookId', webhookController.deleteWebhook);

export default router;
