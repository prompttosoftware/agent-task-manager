import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';

/**
 * @class WebhookController
 * Handles webhook related API requests.
 */
export class WebhookController {
  private readonly webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  /**
   * Registers a new webhook.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @returns {Promise<void>} - A promise that resolves when the webhook is registered.
   * @throws {Error} If there's an error during webhook registration.
   */
  async registerWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookData = req.body;
      const newWebhook = await this.webhookService.createWebhook(webhookData);
      res.status(201).json(newWebhook);
    } catch (error: any) {
      // Implement centralized error handling here
      console.error('Error registering webhook:', error);
      res.status(500).json({ message: error.message || 'Failed to register webhook' });
    }
  }

  /**
   * Deletes a webhook.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @returns {Promise<void>} - A promise that resolves when the webhook is deleted.
   * @throws {Error} If there's an error during webhook deletion.
   */
  async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookId = req.params.webhookId;
      await this.webhookService.deleteWebhook(webhookId);
      res.status(200).json({ message: 'Webhook deleted successfully' });
    } catch (error: any) {
      // Implement centralized error handling here
      console.error('Error deleting webhook:', error);
      res.status(500).json({ message: error.message || 'Failed to delete webhook' });
    }
  }

  /**
   * Lists all webhooks.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @returns {Promise<void>} - A promise that resolves with the list of webhooks.
   * @throws {Error} If there's an error during fetching webhooks.
   */
  async listWebhooks(req: Request, res: Response): Promise<void> {
    try {
      const webhooks = await this.webhookService.getAllWebhooks();
      res.status(200).json(webhooks);
    } catch (error: any) {
      // Implement centralized error handling here
      console.error('Error listing webhooks:', error);
      res.status(500).json({ message: error.message || 'Failed to list webhooks' });
    }
  }
}
