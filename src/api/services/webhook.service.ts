import { WebhookPayload } from '../types/webhook';
import logger from '../utils/logger';
import fetch from 'node-fetch';

export interface RegisterWebhookRequest {
  url: string;
  events: string[];
}

const webhookQueue: WebhookPayload[] = [];
const deadLetterQueue: WebhookPayload[] = [];
const MAX_RETRIES = 3;

export const enqueueWebhook = (payload: WebhookPayload) => {
  webhookQueue.push(payload);
  logger.info(`Webhook enqueued: ${JSON.stringify(payload)}`);
};

export const getWebhookQueueSize = () => webhookQueue.length;

export const getDeadLetterQueue = () => deadLetterQueue;

export const sendToExternalService = async (url: string, payload: WebhookPayload, retryCount = 0): Promise<void> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        `Webhook failed with status ${response.status} and message: ${errorBody}`,
      );
      throw new Error(`Webhook failed with status ${response.status}`);
    }
    logger.info(`Webhook sent successfully to ${url}`);
  } catch (error: any) {
    logger.error(`Error sending webhook: ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying webhook, attempt ${retryCount + 1}...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      await sendToExternalService(url, payload, retryCount + 1);
    } else {
      deadLetterQueue.push(payload);
      logger.error(`Webhook failed after multiple retries.  Moved to dead letter queue.`);
    }
  }
};

export const processWebhook = async (webhookUrl: string) => {
  if (webhookQueue.length === 0) {
    return;
  }

  const payload = webhookQueue.shift();
  if (!payload) {
    return;
  }

  await sendToExternalService(webhookUrl, payload);
};

