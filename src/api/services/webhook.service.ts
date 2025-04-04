// src/api/services/webhook.service.ts

import { WebhookRegistration, Webhook } from '../api/types/webhook.d';
import { WebhookModel } from '../api/models/webhook';

export class WebhookService {

  async registerWebhook(registration: WebhookRegistration): Promise<Webhook> {
    try {
      const webhook = await WebhookModel.create(registration);
      return webhook;
    } catch (error: any) {
      console.error("Error registering webhook:", error);
      throw error;
    }
  }

  async listWebhooks(): Promise<Webhook[]> {
    try {
      const webhooks = await WebhookModel.getAll();
      return webhooks;
    } catch (error: any) {
      console.error("Error listing webhooks:", error);
      throw error;
    }
  }
}
