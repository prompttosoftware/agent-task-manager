import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';
import { WebhookRegisterRequest, WebhookDeleteResponse, WebhookListResponse } from '../types/webhook.d';

export class WebhookController {
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  async registerWebhook(req: Request, res: Response): Promise<void> {
    try {
      const requestBody: WebhookRegisterRequest = req.body;
      const webhook = await this.webhookService.registerWebhook(requestBody);
      res.status(201).json(webhook);
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookId = req.params.webhookId;
      const result: WebhookDeleteResponse = await this.webhookService.deleteWebhook(webhookId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async listWebhooks(req: Request, res: Response): Promise<void> {
    try {
      const webhooks: WebhookListResponse = await this.webhookService.listWebhooks();
      res.status(200).json(webhooks);
    } catch (error: any) {
      console.error('Error listing webhooks:', error);
      res.status(500).json({ message: error.message });
    }
  }
}
