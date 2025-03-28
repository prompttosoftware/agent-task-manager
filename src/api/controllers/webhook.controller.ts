// src/api/controllers/webhook.controller.ts

import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';

export class WebhookController {
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  async registerWebhook(req: Request, res: Response) {
      const start = Date.now();
    try {
      const { url, events } = req.body;
      const webhook = await this.webhookService.createWebhook(url, events);
      const end = Date.now();
      console.log(`registerWebhook took ${end - start}ms`);
      res.status(201).json(webhook);
    } catch (error: any) {
        const end = Date.now();
        console.log(`registerWebhook took ${end - start}ms`);
      res.status(500).json({ message: error.message });
    }
  }

  async deleteWebhook(req: Request, res: Response) {
      const start = Date.now();
    try {
      const webhookId = parseInt(req.params.id, 10);
      if (isNaN(webhookId)) {
          const end = Date.now();
          console.log(`deleteWebhook (invalid id) took ${end - start}ms`);
        return res.status(400).json({ message: 'Invalid webhook ID' });
      }
      await this.webhookService.deleteWebhook(webhookId);
        const end = Date.now();
        console.log(`deleteWebhook took ${end - start}ms`);
      res.status(204).send(); // No content
    } catch (error: any) {
        const end = Date.now();
        console.log(`deleteWebhook took ${end - start}ms`);
      res.status(500).json({ message: error.message });
    }
  }

  async listWebhooks(req: Request, res: Response) {
      const start = Date.now();
    try {
      const webhooks = await this.webhookService.listWebhooks();
        const end = Date.now();
        console.log(`listWebhooks took ${end - start}ms`);
      res.json(webhooks);
    } catch (error: any) {
        const end = Date.now();
        console.log(`listWebhooks took ${end - start}ms`);
      res.status(500).json({ message: error.message });
    }
  }

  async getWebhookById(req: Request, res: Response) {
      const start = Date.now();
    try {
      const webhookId = parseInt(req.params.id, 10);
      if (isNaN(webhookId)) {
          const end = Date.now();
          console.log(`getWebhookById (invalid id) took ${end - start}ms`);
        return res.status(400).json({ message: 'Invalid webhook ID' });
      }
      const webhook = await this.webhookService.getWebhookById(webhookId);
        const end = Date.now();
        console.log(`getWebhookById took ${end - start}ms`);
      if (!webhook) {
        return res.status(404).json({ message: 'Webhook not found' });
      }
      res.json(webhook);
    } catch (error: any) {
        const end = Date.now();
        console.log(`getWebhookById took ${end - start}ms`);
      res.status(500).json({ message: error.message });
    }
  }
}
