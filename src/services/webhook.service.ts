import { db } from '../db/database';
import { Webhook, WebhookRegisterRequest, WebhookPayload } from '../types/webhook.d';
import { v4 as uuidv4 } from 'uuid';

// In-memory queue for webhooks
const webhookQueue: WebhookPayload[] = [];

// Function to add a webhook payload to the queue
export function enqueueWebhook(payload: WebhookPayload) {
  webhookQueue.push(payload);
  // In a real application, you'd likely trigger a worker here
  // to process the queue asynchronously.
}

// Function to get the next webhook payload from the queue (for testing)
export function dequeueWebhook(): WebhookPayload | undefined {
  return webhookQueue.shift();
}

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
