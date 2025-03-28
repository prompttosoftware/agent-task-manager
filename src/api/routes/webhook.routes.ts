import express, { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

export function createWebhookRoutes(webhookController: WebhookController): Router {
  const router = express.Router();

  router.post('/', webhookController.registerWebhook);
  router.delete('/:webhookId', webhookController.deleteWebhook);
  router.get('/', webhookController.listWebhooks);

  return router;
}
