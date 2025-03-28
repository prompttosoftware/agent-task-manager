import { WebhookRegisterRequest, WebhookRegisterResponse, WebhookDeleteResponse, WebhookListResponse, Webhook, WebhookStatus } from '../types/webhook.d';
import { Database } from '../../src/db/database';

export class WebhookService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async registerWebhook(request: WebhookRegisterRequest): Promise<WebhookRegisterResponse> {
    const { callbackUrl, secret, events } = request;
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    try {
      await this.db.run(
        'INSERT INTO webhooks (id, callbackUrl, secret, events, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, callbackUrl, secret, JSON.stringify(events), WebhookStatus.ACTIVE, now, now]
      );

      return {
        id, 
        callbackUrl,
        events,
        status: WebhookStatus.ACTIVE,
      };
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  async deleteWebhook(webhookId: string): Promise<WebhookDeleteResponse> {
    try {
      const result = await this.db.run('UPDATE webhooks SET status = ?, updatedAt = ? WHERE id = ?', [WebhookStatus.DELETED, new Date().toISOString(), webhookId]);
      if (result.changes === 0) {
          throw new Error(`Webhook with id ${webhookId} not found`);
      }
      return {
        id: webhookId,
        status: WebhookStatus.DELETED,
      };
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  async listWebhooks(): Promise<WebhookListResponse> {
    try {
      const rows: any[] = await this.db.all('SELECT id, callbackUrl, secret, events, status, createdAt, updatedAt FROM webhooks WHERE status != ?', [WebhookStatus.DELETED]);

      const webhooks: Webhook[] = rows.map(row => ({
        id: row.id,
        callbackUrl: row.callbackUrl,
        secret: row.secret,
        events: JSON.parse(row.events),
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      return {
        webhooks,
      };
    } catch (error: any) {
      console.error('Error listing webhooks:', error);
      throw new Error(`Failed to list webhooks: ${error.message}`);
    }
  }
}

