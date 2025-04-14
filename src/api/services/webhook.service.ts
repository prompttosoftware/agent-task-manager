// src/api/services/webhook.service.ts

import { WebhookPayload } from '../types/webhook.d.ts';
import { logger } from '../utils/logger.ts';
import fetch, { Response, RequestInit, FetchError } from 'node-fetch';

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

// Simple in-memory dead letter queue
interface DeadLetterQueueEntry {
  payload: WebhookPayload;
  error: string;
  reason: string;
}

const deadLetterQueue: DeadLetterQueueEntry[] = [];

// Rate limiting using a token bucket
let tokens = 10;
const refillRate = 10 / 60; // 10 tokens per minute
let lastRefill = Date.now();

const refillTokens = () => {
  const now = Date.now();
  const timePassed = now - lastRefill;
  const tokensToAdd = (timePassed / 60000) * refillRate; // Refill rate is per minute
  tokens = Math.min(10, tokens + tokensToAdd);
  lastRefill = now;
};

// Refill tokens every second
setInterval(refillTokens, 1000);

/**
 * Sends a webhook payload to an external service with retry logic, rate limiting, and dead letter queue.
 *
 * @param {WebhookPayload} payload The payload to send.
 * @param {string} webhookUrl The URL of the external service.
 * @returns {Promise<void>}
 */
export async function sendToExternalService(payload: WebhookPayload, webhookUrl: string): Promise<void> {
  let retries = 3;

  while (retries >= 0) {
    refillTokens();
    if (tokens < 1) {
      logger.warn(`Rate limit exceeded for ${webhookUrl}. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      retries--;
      if (retries < 0) {
        const reason = 'Rate limit exceeded';
        logger.error(`Failed to send to ${webhookUrl} after rate limit. Adding to DLQ. Reason: ${reason}`);
        deadLetterQueue.push({ payload, error: 'Rate limit exceeded', reason });
        return;
      }
      continue;
    }

    tokens--;

    try {
      logger.info(`Sending webhook to ${webhookUrl}, attempt ${4 - retries}`);
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 5000, // 5 seconds timeout
      };

      const response: Response = await fetch(webhookUrl, options);

      if (response.ok) {
        logger.info(`Webhook sent successfully to ${webhookUrl}`);
        return;
      } else {
        const status = response.status;
        const statusText = response.statusText;
        logger.warn(`Webhook to ${webhookUrl} failed with status ${status}: ${statusText}`);

        if (status >= 400 && status < 500) {
          // Client error - don't retry
          const reason = `Client error: ${status} ${statusText}`;
          logger.error(reason);
          deadLetterQueue.push({ payload, error: reason, reason: 'Client error' });
          return;
        } else {
          // Server error - retry
          if (retries > 0) {
            logger.info(`Retrying in 1000ms... (${retries} retries remaining)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
          } else {
            const reason = `Server error after multiple retries: ${status} ${statusText}`;
            logger.error(reason);
            deadLetterQueue.push({ payload, error: reason, reason: 'Max retries exceeded' });
            return;
          }
        }
      
      }
    } catch (error: any) {
      if (error instanceof FetchError) {
          logger.error(`Network error sending webhook to ${webhookUrl}: ${error.message}`);
      } else {
        logger.error(`Error sending webhook to ${webhookUrl}: ${error.message}`);
      }
      if (retries > 0) {
        logger.info(`Retrying in 1000ms... (${retries} retries remaining)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      } else {
        const reason = `Network error after multiple retries: ${error.message}`;
        logger.error(reason);
        deadLetterQueue.push({ payload, error: error.message, reason: 'Max retries exceeded or network error' });
        return;
      }
    }
  }
}

export const enqueueWebhook = (payload: WebhookPayload) => {
  webhookQueue.enqueue(payload);
};

export const processWebhook = async (webhookUrl: string) => {
  try {
    const payload = webhookQueue.dequeue();
    if (payload) {
      logger.info('Processing webhook:', payload);
      await sendToExternalService(payload, webhookUrl);
    }
  } catch (error: any) {
    logger.error('Error in processWebhook:', error);
  }
};

export const getWebhookQueueSize = () => webhookQueue.size();

/**
 * Returns the contents of the dead letter queue.
 *
 * @returns {DeadLetterQueueEntry[]} The dead letter queue.
 */
export const getDeadLetterQueue = (): DeadLetterQueueEntry[] => {
  return [...deadLetterQueue]; // Return a copy to prevent external modification
};
