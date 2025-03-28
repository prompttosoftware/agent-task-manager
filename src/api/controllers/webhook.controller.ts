import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';
import { WebhookRegisterRequest } from '../types/webhook.d';

export class WebhookController {
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  async registerWebhook(req: Request, res: Response) {
    try {
      const { callbackUrl, secret, events } = req.body;
      const request: WebhookRegisterRequest = {
        callbackUrl,
        secret,
        events,
      };
      const response = await this.webhookService.registerWebhook(request);
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      res.status(500).json({ error: error.message || 'Failed to register webhook' });
    }
  }

  async deleteWebhook(req: Request, res: Response) {
    try {
      const webhookId = req.params.webhookId;
      const response = await this.webhookService.deleteWebhook(webhookId);
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ error: error.message || 'Failed to delete webhook' });
    }
  }

  async listWebhooks(req: Request, res: Response) {
    try {
      const response = await this.webhookService.listWebhooks();
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error listing webhooks:', error);
      res.status(500).json({ error: error.message || 'Failed to list webhooks' });
    }
  }
}

// Instantiate WebhookController with the service
import { createWebhook, deleteWebhook, listWebhooks } from '../services/webhook.service';
const webhookService = {
  registerWebhook: createWebhook,
  deleteWebhook: deleteWebhook,
  listWebhooks: listWebhooks
}

const webhookController = new WebhookController(webhookService);

export const registerWebhook = webhookController.registerWebhook.bind(webhookController);
export const deleteWebhook = webhookController.deleteWebhook.bind(webhookController);
export const listWebhooks = webhookController.listWebhooks.bind(webhookController);
