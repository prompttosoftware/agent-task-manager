// src/controllers/webhookController.ts

import { Request, Response } from 'express';
import { WebhookService } from '../services/webhookService';

const webhookService = new WebhookService();

export class WebhookController {
  // Webhook Registration: POST /webhook
  registerWebhook(req: Request, res: Response) {
    try {
      const { name, url, events, filters } = req.body;
      const webhook = webhookService.registerWebhook(name, url, events, filters);
      res.status(201).json(webhook);
    } catch (error:any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  // Webhook Listing: GET /webhook
  getWebhooks(req: Request, res: Response) {
    try {
      const webhooks = webhookService.getWebhooks();
      if (webhooks.length === 0) {
        return res.status(204).send(); // No Content
      }
      res.status(200).json(webhooks);
    } catch (error:any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  // Webhook Deletion: DELETE /webhook/{webhookID}
  deleteWebhook(req: Request, res: Response) {
    try {
      const { webhookID } = req.params;
      const deleted = webhookService.deleteWebhook(webhookID);
      if (deleted) {
        res.status(204).send(); // No Content
      } else {
        res.status(404).json({ message: 'Webhook not found' });
      }
    } catch (error:any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }
}
