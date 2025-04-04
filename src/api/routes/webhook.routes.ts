// src/api/routes/webhook.routes.ts

import express, { Router } from 'express';
import { createWebhook, listWebhooks, getWebhook, updateWebhook, deleteWebhook } from '../controllers/webhook.controller';
import { validateWebhookCreate, validateWebhookUpdate } from '../middleware/webhookValidation';

const router: Router = express.Router();

router.post('/webhooks', validateWebhookCreate, createWebhook);
router.get('/webhooks', listWebhooks);
router.get('/webhooks/:id', getWebhook);
router.put('/webhooks/:id', validateWebhookUpdate, updateWebhook);
router.delete('/webhooks/:id', deleteWebhook);

export default router