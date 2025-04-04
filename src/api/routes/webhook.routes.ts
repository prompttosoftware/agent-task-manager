// src/api/routes/webhook.routes.ts
import express from 'express';
import * as webhookController from '../controllers/webhook.controller';

const router = express.Router();

// POST /webhooks - Create a new webhook subscription
router.post('/webhooks', webhookController.createWebhook);

// DELETE /webhooks/:webhookId - Delete a webhook
router.delete('/webhooks/:webhookId', webhookController.deleteWebhook);

// GET /webhooks - List all registered webhooks
router.get('/webhooks', webhookController.listWebhooks);

export default router;
