// src/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';

export class WebhookController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  async registerWebhook(req: Request, res: Response) {
    // Input validation
    // try {
      const { url, eventType } = req.body;

      if (!url || !eventType) {
        return res.status(400).json({ error: 'Missing required fields: url and eventType' });
      }
      
      // Business logic: Call service to register webhook
      try{
        const webhook = await this.webhookService.registerWebhook(url, eventType);

        // Format response
        return res.status(201).json(webhook);
      } catch(error:any){
        console.error("Error registering webhook:", error);
        return res.status(500).json({ error: error.message || 'Failed to register webhook' });
      }
    // } catch (error: any) {
    //   console.error("Error in registerWebhook:", error);
    //   return res.status(500).json({ error: 'Internal server error' });
    // }
  }

  async listWebhooks(req: Request, res: Response) {
    // Business logic: Call service to list webhooks
    try {
      const webhooks = await this.webhookService.listWebhooks();

      // Format response
      return res.status(200).json(webhooks);
    } catch (error: any) {
      console.error("Error listing webhooks:", error);
      return res.status(500).json({ error: error.message || 'Failed to list webhooks' });
    }
  }

  async deleteWebhook(req: Request, res: Response) {
    // Input validation
    const { webhookId } = req.params;
    if (!webhookId) {
      return res.status(400).json({ error: 'Missing webhookId' });
    }
    // Business logic: Call service to delete webhook
    try {
      await this.webhookService.deleteWebhook(webhookId);

      // Format response
      return res.status(204).send(); // No content
    } catch (error: any) {
      console.error("Error deleting webhook:", error);
      return res.status(500).json({ error: error.message || 'Failed to delete webhook' });
    }
  }
}
