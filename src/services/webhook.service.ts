import { db } from '../db/database';
import { Webhook, WebhookRegisterRequest, WebhookPayload } from '../types/webhook.d';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

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

// The following functions are related to queueing
// They will be implemented later or removed based on the design.


export async function addWebhookPayloadToQueue(webhookId: string, payload: any): Promise<void> {
  // Implement queueing logic here. This could involve using a message queue service like RabbitMQ,
  // Redis, or a database table to store the payloads for later processing.
  // For this example, we'll just log the payload.
  console.log(`Adding webhook payload to queue for webhookId ${webhookId}:`, payload);
  // In a real application, you would enqueue the payload.
}
