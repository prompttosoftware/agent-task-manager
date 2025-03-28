// Import necessary modules and types
import { WebhookRegisterRequest, Webhook, WebhookListResponse, WebhookDeleteResponse } from '../types/webhook.d';
import Database from '../db/database'; // Assuming you have a database module

// Define custom error class for WebhookService
class WebhookServiceError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'WebhookServiceError';
    Object.setPrototypeOf(this, WebhookServiceError.prototype);
  }
}

// Define the WebhookService class
class WebhookService {
  private db: Database; // Database connection

  constructor(db: Database) {
    this.db = db;
  }

  async createWebhook(data: WebhookRegisterRequest): Promise<Webhook> {
    try {
      // Validate data if needed
      const { callbackUrl, events, secret } = data;
      if (!callbackUrl || !events || !Array.isArray(events) || events.length === 0) {
        throw new WebhookServiceError('INVALID_INPUT', 'Missing required fields for webhook creation.');
      }

      // Further validation for events can be added here

      // Prepare the SQL statement
      const sql = `INSERT INTO webhooks (callbackUrl, events, secret) VALUES (?, ?, ?)`;
      const params = [callbackUrl, JSON.stringify(events), secret];

      //  Execute the query
      try {
        const result = await this.db.run(sql, params);
        if (!result.lastID) {
          throw new WebhookServiceError('DATABASE_ERROR', 'Failed to create webhook: No ID returned.');
        }
        // Handle the result, return the inserted webhook's ID
        const webhook = { id: result.lastID.toString(), callbackUrl, events, status: 'active' };
        return webhook;
      } catch (dbError: any) {
        console.error('Database error creating webhook:', dbError);
        throw new WebhookServiceError('DATABASE_ERROR', dbError.message || 'Internal database error.');
      }
    } catch (error: any) {
      console.error('Error creating webhook:', error);
      if (error instanceof WebhookServiceError) {
        throw error; // Re-throw if it's a service-specific error
      }
      throw new WebhookServiceError('UNEXPECTED_ERROR', error.message || 'An unexpected error occurred.'); // Wrap other errors
    }
  }

  async getAllWebhooks(): Promise<WebhookListResponse> {
    try {
      const sql = `SELECT id, callbackUrl, events, secret, status FROM webhooks`;
      try {
        const rows = await this.db.all(sql);
        const webhooks = rows.map(row => ({
          id: row.id.toString(),
          callbackUrl: row.callbackUrl,
          events: JSON.parse(row.events),
          secret: row.secret,
          status: row.status
        }));
        return { webhooks: webhooks };
      } catch (dbError: any) {
        console.error('Database error getting all webhooks:', dbError);
        throw new WebhookServiceError('DATABASE_ERROR', dbError.message || 'Internal database error.');
      }
    } catch (error: any) {
      console.error('Error getting all webhooks:', error);
      if (error instanceof WebhookServiceError) {
          throw error;
      }
      throw new WebhookServiceError('UNEXPECTED_ERROR', error.message || 'An unexpected error occurred.');
    }
  }

  async deleteWebhook(webhookId: string): Promise<WebhookDeleteResponse> {
    try {
      if (!webhookId) {
        throw new WebhookServiceError('INVALID_INPUT', 'Webhook ID is required for deletion.');
      }

      const sql = `DELETE FROM webhooks WHERE id = ?`;
      const params = [webhookId];

      try {
        const result = await this.db.run(sql, params);
        if (result.changes === 0) {
          throw new WebhookServiceError('NOT_FOUND', `Webhook with ID ${webhookId} not found.`);
        }

        return { id: webhookId, status: 'deleted' };
      } catch (dbError: any) {
        console.error('Database error deleting webhook:', dbError);
        throw new WebhookServiceError('DATABASE_ERROR', dbError.message || 'Internal database error.');
      }
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      if (error instanceof WebhookServiceError) {
          throw error;
      }
      throw new WebhookServiceError('UNEXPECTED_ERROR', error.message || 'An unexpected error occurred.');
    }
  }
}

export default WebhookService;
