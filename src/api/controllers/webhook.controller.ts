// src/api/controllers/webhook.controller.ts

import { Request, Response } from 'express';
import { WebhookService } from '../api/services/webhook.service';
import { WebhookRegistration } from '../api/types/webhook.d';

const webhookService = new WebhookService();

export async function registerWebhook(req: Request, res: Response) {
  try {
    const registration: WebhookRegistration = req.body;
    const webhook = await webhookService.registerWebhook(registration);
    res.status(201).json(webhook);
  } catch (error: any) {
    console.error("Webhook registration error:", error);
    res.status(400).json({ error: error.message || 'Failed to register webhook' });
  }
}

export async function listWebhooks(req: Request, res: Response) {
  try {
    const webhooks = await webhookService.listWebhooks();
    res.status(200).json(webhooks);
  } catch (error: any) {
    console.error("Error listing webhooks:", error);
    res.status(500).json({ error: 'Failed to retrieve webhooks' });
  }
}
