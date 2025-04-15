// src/api/routes/webhook.routes.ts
import express from 'express';
import { registerWebhook, deleteWebhook, listWebhooks } from '../api/controllers/webhook.controller';
const router = express.Router();

router.post('/api/webhooks', registerWebhook);
router.delete('/api/webhooks/:webhookId', deleteWebhook);
router.get('/api/webhooks', listWebhooks);

export default router;