import { Request, Response } from 'express';
import { WebhookService } from '../../services/webhook.service';
import { WebhookPayload } from '../../types/webhook.d';

/**
 * @class WebhookController
 * @classdesc Handles incoming webhook requests.
 */
export class WebhookController {
  private readonly webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  /**
   * @method handleWebhook
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<void>}
   * @description Handles incoming webhook requests, validates the payload, and passes it to the webhook service for processing.
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload: WebhookPayload = req.body;

      // Validate the payload (e.g., using a schema or library like Zod)
      if (!payload || !payload.event || !payload.data) {
        res.status(400).send({ message: 'Invalid webhook payload' });
        return;
      }

      await this.webhookService.handleEvent(payload);
      res.status(200).send({ message: 'Webhook processed successfully' });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).send({ message: 'Error processing webhook', error: error.message });
    }
  }
}
