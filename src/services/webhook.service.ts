// Import necessary modules and types
import { WebhookPayload, Webhook } from '../types/webhook.d';
import Database from '../db/database'; // Assuming you have a database module

// Define the WebhookService class
class WebhookService {
  private db: Database; // Database connection

  constructor(db: Database) {
    this.db = db;
  }

  async createWebhook(data: WebhookPayload): Promise<Webhook> {
    try {
      // Validate data if needed
      const { url, eventType } = data;
      if (!url || !eventType) {
        throw new Error('Missing required fields for webhook creation.');
      }

      // Prepare the SQL statement
      const sql = `INSERT INTO webhooks (url, event_type) VALUES (?, ?)`;
      const params = [url, eventType];

      // Execute the query
      const result = await this.db.run(sql, params);

      // Handle the result, return the inserted webhook's ID
      return { id: result.lastID, url, eventType };
    } catch (error: any) {
      console.error('Error creating webhook:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  async getAllWebhooks(): Promise<Webhook[]> {
    try {
      const sql = `SELECT * FROM webhooks`;
      const rows = await this.db.all(sql);
      return rows;
    } catch (error: any) {
      console.error('Error getting all webhooks:', error);
      throw error;
    }
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    try {
      if (!webhookId) {
        throw new Error('Webhook ID is required for deletion.');
      }

      const sql = `DELETE FROM webhooks WHERE id = ?`;
      const params = [webhookId];

      const result = await this.db.run(sql, params);

      if (result.changes === 0) {
        throw new Error(`Webhook with ID ${webhookId} not found.`);
      }
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }
}

export default WebhookService;