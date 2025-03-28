// src/services/webhookWorker.ts
import { WebhookService } from './webhook.service';
import { WebhookPayload } from '../api/types/webhook.d';

export class WebhookWorker {
  private webhookService: WebhookService;
  private queue: WebhookPayload[] = [];
  private isProcessing: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  public enqueue(payload: WebhookPayload): void {
    this.queue.push(payload);
    this.startProcessing();
  }

  private startProcessing(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.intervalId = setInterval(() => {
        this.processQueue();
      }, 1000); // Process every second
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.stopProcessing();
      return;
    }

    const payload = this.queue.shift();
    if (payload) {
      try {
        await this.webhookService.processWebhookEvent(payload);
      } catch (error) {
        console.error('Error processing webhook in worker:', error);
        // Consider adding retry logic or dead-letter queue
      }
    }
  }

  private stopProcessing(): void {
    this.isProcessing = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
