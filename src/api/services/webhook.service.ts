import { WebhookRegistration, WebhookPayload, Webhook } from '../types/webhook';
import Database from 'better-sqlite3';

const db = new Database('atm.db');

const createWebhooksTable = db.prepare(
  `CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT
  )`
);

createWebhooksTable.run();

const insertWebhook = db.prepare(
  'INSERT INTO webhooks (id, url, events, secret) VALUES (?, ?, ?, ?)'
);

const deleteWebhookStmt = db.prepare('DELETE FROM webhooks WHERE id = ?');

const listWebhooksStmt = db.prepare('SELECT * FROM webhooks');

const getWebhookById = db.prepare('SELECT * FROM webhooks WHERE id = ?');

export const registerWebhook = (registration: WebhookRegistration): Webhook => {
  const id = generateId();
  const { url, events, secret } = registration;
  insertWebhook.run(id, url, JSON.stringify(events), secret);
  return { id, url, events, secret };
};

export const deleteWebhook = (webhookId: string): boolean => {
  const result = deleteWebhookStmt.run(webhookId);
  return result.changes > 0;
};

export const listWebhooks = (): Webhook[] => {
  const rows = listWebhooksStmt.all() as any[];
  return rows.map(row => ({
    id: row.id,
    url: row.url,
    events: JSON.parse(row.events),
    secret: row.secret,
  }));
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const processWebhookEvent = (payload: WebhookPayload): void => {
  const webhooks = listWebhooks();
  const matchingWebhooks = webhooks.filter(webhook => webhook.events.includes(payload.event));

  matchingWebhooks.forEach(webhook => {
    // In a real application, you'd send the payload to the webhook's URL here
    console.log(`Sending event ${payload.event} to ${webhook.url}`);
    // You would typically use a library like 'axios' or 'node-fetch' to make the POST request
  });
};
