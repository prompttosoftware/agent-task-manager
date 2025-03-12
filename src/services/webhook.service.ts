// src/services/webhook.service.ts
import { v4 as uuidv4 } from 'uuid';
import { WebhookRepository } from '../repositories/webhook.repository';

export class WebhookService {
  private webhookRepository: WebhookRepository;

  constructor() {
    this.webhookRepository = new WebhookRepository();
  }

  async registerWebhook(url: string, eventType: string) {
    // Business logic: Validate URL, eventType, etc.
    if (!url.startsWith('http')) {
      throw new Error('Invalid URL format');
    }
    const webhookId = uuidv4();
    // Interaction with repository
    const webhook = await this.webhookRepository.create({ id: webhookId, url, eventType });
    return {id: webhook.id, url: webhook.url, eventType: webhook.eventType};
  }

  async listWebhooks() {
    // Interaction with repository
    const webhooks = await this.webhookRepository.getAll();
    return webhooks.map(webhook => ({id: webhook.id, url: webhook.url, eventType: webhook.eventType}));
  }

  async deleteWebhook(webhookId: string) {
    // Interaction with repository
    await this.webhookRepository.delete(webhookId);
  }
}
