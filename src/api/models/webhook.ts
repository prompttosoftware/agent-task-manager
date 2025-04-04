// src/api/models/webhook.ts

import { Webhook, WebhookRegistration, WebhookEvent } from '../api/types/webhook.d';
import { db } from '../db/database';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class WebhookModel implements Webhook {
  id?: number;
  event: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;

  constructor(webhook: Webhook) {
    this.id = webhook.id;
    this.event = webhook.event;
    this.url = webhook.url;
    this.createdAt = webhook.createdAt;
    this.updatedAt = webhook.updatedAt;
  }

  static async create(registration: WebhookRegistration): Promise<Webhook> {
    // Validation logic
    const newWebhook = plainToClass(WebhookModel, registration);
    const validationErrors = await validate(newWebhook);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
    }

    const { event, url } = registration;
    const info = db.prepare('INSERT INTO webhooks (event, url) VALUES (?, ?)').run(event, url);
    const id = info.lastInsertRowid as number;
    return { id, event, url };
  }

  static async getById(id: number): Promise<Webhook | undefined> {
    const row = db.prepare('SELECT id, event, url, createdAt, updatedAt FROM webhooks WHERE id = ?').get(id) as Webhook;
    if (!row) {
      return undefined;
    }
    return new WebhookModel(row);
  }

  static async getAll(): Promise<Webhook[]> {
    const rows = db.prepare('SELECT id, event, url, createdAt, updatedAt FROM webhooks').all() as Webhook[];
    return rows.map(row => new WebhookModel(row));
  }

  static async delete(id: number): Promise<void> {
    db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
  }
}
