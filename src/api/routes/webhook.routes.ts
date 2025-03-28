// src/api/routes/webhook.routes.ts
import { Router } from 'express';
import { registerWebhook, deleteWebhook, listWebhooks } from '../controllers/webhook.controller';

const router = Router();

router.post('/api/webhooks', registerWebhook);
router.delete('/api/webhooks/:webhookId', deleteWebhook);
router.get('/api/webhooks', listWebhooks);

export default router;
