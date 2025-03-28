// src/api/services/webhook.service.ts
import { v4 as uuidv4 } from 'uuid';
import { Webhook, WebhookRegisterRequest, WebhookListResponse, WebhookDeleteResponse, WebhookPayload } from '../types/webhook.d';
import Database from '../../src/db/database';

export class WebhookService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async registerWebhook(request: WebhookRegisterRequest): Promise<WebhookRegisterResponse> {
    const id = uuidv4();
    const webhook: Webhook = {
      id: id,
      url: request.url,
      events: request.events,
      secret: request.secret,
      active: true,
    };

    try {
      await this.db.run(
        `INSERT INTO webhooks (id, url, events, secret, active) VALUES (?, ?, ?, ?, ?) `,
        [webhook.id, webhook.url, JSON.stringify(webhook.events), webhook.secret, webhook.active ? 1 : 0]
      );
      return {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        status: 'active',
      };
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  async deleteWebhook(webhookId: string): Promise<WebhookDeleteResponse> {
    try {
      const result = await this.db.run('DELETE FROM webhooks WHERE id = ?', [webhookId]);
      if (result.changes === 0) {
        return { message: 'Webhook not found', webhookId: webhookId, success: false };
      }
      return { message: 'Webhook deleted', webhookId: webhookId, success: true };
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  async listWebhooks(): Promise<WebhookListResponse> {
    try {
      const rows = await this.db.all('SELECT * FROM webhooks');
      const webhooks = rows.map(row => ({
        id: row.id,
        url: row.url,
        events: JSON.parse(row.events) as string[],
        secret: row.secret,
        active: row.active === 1, // Convert back to boolean
      }));
      return { webhooks: webhooks, total: webhooks.length };
    } catch (error: any) {
      console.error('Error listing webhooks:', error);
      throw new Error(`Failed to list webhooks: ${error.message}`);
    }
  }

  async processWebhookEvent(payload: WebhookPayload): Promise<void> {
    try {
      const rows = await this.db.all('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', [`%${payload.event}%`]);
      const webhooks = rows.map(row => ({
        id: row.id,
        url: row.url,
        events: JSON.parse(row.events) as string[],
        secret: row.secret,
        active: row.active === 1, // Convert back to boolean
      }));

      for (const webhook of webhooks) {
        if (webhook.events.includes(payload.event)) {
          this.invokeWebhook(webhook, payload);
        }
      }
    } catch (error: any) {
      console.error('Error processing webhook event:', error);
      throw new Error(`Failed to process webhook event: ${error.message}`);
    }
  }

  private async invokeWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (webhook.secret) {
        headers['X-Webhook-Signature'] = this.generateSignature(JSON.stringify(payload), webhook.secret);
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook invocation failed for ${webhook.id} with status ${response.status}`);
      }
    } catch (error: any) {
      console.error(`Error invoking webhook ${webhook.id}:`, error);
    }
  }

  private generateSignature(data: string, secret: string): string {
    // In a real application, use a proper HMAC implementation
    // This is a placeholder.  Do not use this in production.
    return 'signature';
  }
}
