import { Webhook } from '../types/webhook.d';

export class WebhookService {
  private webhookQueue: Webhook[] = [];

  async enqueue(webhook: Webhook): Promise<void> {
    this.webhookQueue.push(webhook);
    console.log(`Webhook enqueued: ${JSON.stringify(webhook)}`);
  }

  async processQueue(): Promise<void> {
    while (this.webhookQueue.length > 0) {
      const webhook = this.webhookQueue.shift();
      if (webhook) {
        console.log(`Processing webhook: ${JSON.stringify(webhook)}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Webhook processed successfully`);
      }
    }
  }

  getQueueLength(): number {
    return this.webhookQueue.length;
  }
}