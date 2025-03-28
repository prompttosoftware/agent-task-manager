// src/api/routes/webhook.routes.ts
import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

export function createWebhookRoutes(controller: WebhookController): Router {
  const router = Router();

  router.post('/webhooks', controller.registerWebhook);
  router.delete('/webhooks/:id', controller.deleteWebhook);
  router.get('/webhooks', controller.listWebhooks);
  router.get('/webhooks/:id', controller.getWebhookById);

  return router;
}