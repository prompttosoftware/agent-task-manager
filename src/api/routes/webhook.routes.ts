// src/api/routes/webhook.routes.ts
import express from 'express';
import { registerWebhook, removeWebhook, listWebhooks, simulateEvent } from '../controllers/webhook.controller';
import { validateWebhookCreation } from '../middleware/validation.middleware';
import { validateWebhookId } from '../middleware/validation.middleware';

const router = express.Router();

// POST /webhooks - Create a new webhook
router.post('/webhooks', validateWebhookCreation, registerWebhook);

// DELETE /webhooks/:id - Delete a webhook
router.delete('/webhooks/:id', validateWebhookId, removeWebhook);

// GET /webhooks - Retrieve all webhooks
router.get('/webhooks', listWebhooks);

// POST /webhooks/simulate - Simulate an event
router.post('/webhooks/simulate', simulateEvent);

export default router;
