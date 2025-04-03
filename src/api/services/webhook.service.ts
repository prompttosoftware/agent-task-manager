import { db } from '../db/database';
import { Webhook, WebhookRegisterRequest, WebhookPayload } from '../types/webhook.d';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import winston from 'winston';

const logger = winston.createLogger({
    level: config.agent.logLevel || 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'webhook-service' },
    transports: [
        new winston.transports.Console(),
    ],
});

export async function createWebhook(webhookData: WebhookRegisterRequest): Promise<Webhook> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO webhooks (id, callbackUrl, secret, events, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    webhookData.callbackUrl,
    webhookData.secret || null,
    JSON.stringify(webhookData.events),
    'active',
    now,
    now
  );

  if (result.changes === 0) {
    throw new Error('Failed to create webhook');
  }

  return {
    id: id,
    callbackUrl: webhookData.callbackUrl,
    secret: webhookData.secret,
    events: webhookData.events,
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

export async function getWebhook(id: string): Promise<Webhook | undefined> {
  const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id) as Webhook | undefined;

  if (row) {
    row.events = JSON.parse(row.events);
  }

  return row;
}

export async function listWebhooks(): Promise<Webhook[]> {
  const rows = db.prepare('SELECT * FROM webhooks').all() as Webhook[];
  return rows.map(row => {
    row.events = JSON.parse(row.events);
    return row;
  });
}

export async function deleteWebhook(id: string): Promise<boolean> {
  const result = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
  return result.changes > 0;
}

export async function processWebhookQueue(webhookId: string, payload: any) {
  logger.info('Processing webhook for ' + webhookId + ' with payload', { payload });
  const webhook = await getWebhook(webhookId);
  if (!webhook) {
      logger.warn("Webhook not found for id: " + webhookId);
      return;
  }

  try {
      const response = await fetch(webhook.callbackUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
              // Add any other headers as needed, e.g., for authentication
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          logger.error(`Webhook call failed for ${webhookId} with status ${response.status}`);
          // Handle failed webhook calls (e.g., retry, dead-letter queue)
      } else {
          logger.info(`Webhook call successful for ${webhookId}`);
      }
  } catch (error) {
      logger.error(`Error calling webhook for ${webhookId}:`, error);
      // Handle network errors or other exceptions
  }
}

// The following functions are related to queueing
// They will be implemented later or removed based on the design.

export interface WebhookQueueItem {
  webhookId: string;
  payload: any;
  timestamp: string;
}

export async function addWebhookPayloadToQueue(webhookId: string, payload: any): Promise<void> {
  // Implement queueing logic here. This could involve using a message queue service like RabbitMQ,
  // Redis, or a database table to store the payloads for later processing.
  // For this example, we'll just log the payload.  Actual implementation is in processWebhookQueue.
  // console.log(`Adding webhook payload to queue for webhookId ${webhookId}:`, payload);
  // In a real application, you would enqueue the payload.
  await processWebhookQueue(webhookId, payload);
}
