// src/services/webhookWorker.ts
import { processWebhookQueue } from './webhook.service';
import { WebhookPayload } from '../types/webhook.d'; // Corrected import
import winston from 'winston';
import { config } from '../config';

const logger = winston.createLogger({
  level: config.agent.logLevel || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'webhook-worker' },
  transports: [
    new winston.transports.Console(),
  ],
});

export class WebhookWorker {
  private queue: WebhookPayload[] = [];
  private isProcessing: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private queueInterval: number = config.webhookWorker.queueInterval || 1000; // Default to 1 second

  public enqueue(payload: WebhookPayload): void {
    this.queue.push(payload);
    this.startProcessing();
  }

  private startProcessing(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.intervalId = setInterval(() => {
        this.processQueue();
      }, this.queueInterval); // Process based on configuration
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
        await processWebhookQueue(payload.webhookId, payload);
      } catch (error: any) {
        logger.error('Error processing webhook in worker:', { error: error.message, payload });
        // Consider adding retry logic or dead-letter queue.  For now, just log.
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