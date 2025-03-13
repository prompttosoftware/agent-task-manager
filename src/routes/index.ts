// src/routes/index.ts
import express from 'express';
import { issueController } from '../controllers';
import { createWebhookHandler, getWebhookHandler, deleteWebhookHandler } from '../controllers/webhookController';

const router = express.Router();

// Issue routes
router.get('/issues', issueController.getAllIssues);

// Webhook routes
router.post('/webhook', createWebhookHandler);
router.get('/webhook/:webhookID', getWebhookHandler);
router.delete('/webhook/:webhookID', deleteWebhookHandler);

export default router;
