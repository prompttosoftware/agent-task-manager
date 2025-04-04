import { Router } from 'express';
import { registerWebhook, deleteWebhook, listWebhooks } from '../controllers/webhook.controller';
import { webhookValidation } from '../middleware/webhookValidation';

const router = Router();

// POST /api/webhooks - Register webhook
router.post('/api/webhooks', webhookValidation, registerWebhook);

// DELETE /api/webhooks/:webhookId - Delete webhook
router.delete('/api/webhooks/:webhookId', deleteWebhook);

// GET /api/webhooks - List webhooks
router.get('/api/webhooks', listWebhooks);

export default router;
