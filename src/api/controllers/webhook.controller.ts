// src/api/controllers/webhook.controller.ts
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
      const request: WebhookRegisterRequest = req.body;
      const result = await this.webhookService.registerWebhook(request);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async deleteWebhook(req: Request, res: Response) {
    try {
      const webhookId = req.params.id;
      const result = await this.webhookService.deleteWebhook(webhookId);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async listWebhooks(req: Request, res: Response) {
    try {
      const result = await this.webhookService.listWebhooks();
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error listing webhooks:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getWebhookById(req: Request, res: Response) {
    try {
      const webhookId = req.params.id;
      const webhook = await this.webhookService.getWebhookById(webhookId);
      if (webhook) {
        res.status(200).json(webhook);
      } else {
        res.status(404).json({ message: 'Webhook not found' });
      }
    } catch (error: any) {
      console.error('Error getting webhook by id:', error);
      res.status(500).json({ message: error.message });
    }
  }
}
