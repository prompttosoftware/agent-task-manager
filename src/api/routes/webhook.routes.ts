import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

/**
 * @function webhookRoutes
 * @param {WebhookController} webhookController - The webhook controller instance.
 * @returns {Router} - Express router for webhook endpoints.
 * @description Defines the routes for the webhook API.
 */
export function webhookRoutes(webhookController: WebhookController): Router {
  const router = Router();

  /**
   * @route POST /webhooks
   * @description Receives webhook events.
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   */
  router.post('/', webhookController.handleWebhook.bind(webhookController));

  return router;
}
