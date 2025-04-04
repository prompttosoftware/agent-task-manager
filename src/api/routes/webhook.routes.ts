// src/api/routes/webhook.routes.ts

import express from 'express';
import { registerWebhook, listWebhooks } from '../api/controllers/webhook.controller';
import { validateWebhookRegistration } from '../api/middleware/webhookValidation';

const router = express.Router();

router.post('/webhooks', validateWebhookRegistration, registerWebhook);
router.get('/webhooks', listWebhooks);

export default router;
