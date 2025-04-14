// src/api/services/webhook.service.ts

import { WebhookPayload } from '../types/webhook.d.ts';

interface WebhookQueue {
  enqueue: (payload: WebhookPayload) => void;
  dequeue: () => WebhookPayload | undefined;
  size: () => number;
  peek: () => WebhookPayload | undefined;
}

class InMemoryWebhookQueue implements WebhookQueue {
  private queue: WebhookPayload[] = [];

  enqueue(payload: WebhookPayload): void {
    this.queue.push(payload);
  }

  dequeue(): WebhookPayload | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }

  peek(): WebhookPayload | undefined {
    return this.queue[0];
  }
}

const webhookQueue = new InMemoryWebhookQueue();

export const enqueueWebhook = (payload: WebhookPayload) => {
  webhookQueue.enqueue(payload);
};

export const processWebhook = () => {
  const payload = webhookQueue.dequeue();
  if (payload) {
    // Simulate processing the webhook
    console.log('Processing webhook:', payload);
    // In a real implementation, this would involve sending the payload to an external service.
  }
};

export const getWebhookQueueSize = () => webhookQueue.size();
