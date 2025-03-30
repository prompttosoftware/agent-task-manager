// src/api/routes/webhook.routes.ts
import { Hono } from 'hono';
import { WebhookController } from '../controllers/webhook.controller';

export function createWebhookRoutes(controller: WebhookController): Hono {
  const router = new Hono();

  router.post('/webhooks', (c) => controller.registerWebhook(c));
  router.delete('/webhooks/:id', (c) => controller.deleteWebhook(c));
  router.get('/webhooks', (c) => controller.listWebhooks(c));
  router.get('/webhooks/:id', (c) => controller.getWebhookById(c));

  return router;
}