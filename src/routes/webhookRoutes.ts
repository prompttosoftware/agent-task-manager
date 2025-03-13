// src/routes/webhookRoutes.ts

import express from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = express.Router();
const webhookController = new WebhookController();

// POST /webhook
router.post('/', webhookController.registerWebhook);

// GET /webhook
router.get('/', webhookController.getWebhooks);

// DELETE /webhook/:webhookID
router.delete('/:webhookID', webhookController.deleteWebhook);

export default router;
