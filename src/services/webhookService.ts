// This file will contain the implementation for the webhook service.
import axios from 'axios';
import { getDBConnection } from '../config/db';

interface WebhookPayload {
  timestamp: number;
  webhookEvent: string;
  issue: any;
}

export const createWebhook = async (webhookData: { url: string; events: string }) => {
  try {
    const db = await getDBConnection();
    const newWebhook: any = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Webhooks (url, events) VALUES (?, ?)`,
        [webhookData.url, webhookData.events],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: (this as any).lastID, url: webhookData.url, events: webhookData.events });
          }
        }
      );
    });

    return newWebhook;
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    throw error;
  }
};

export const deleteWebhook = async (webhookId: string) => {
  try {
    const db = await getDBConnection();
    await new Promise<void>((resolve, reject) => {
      db.run(
        `DELETE FROM Webhooks WHERE id = ?`,
        [webhookId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    throw error;
  }
};

export async function triggerWebhooks(eventType: string, issueData: any) {
  try {
    const db = await getDBConnection();
    const webhooks: any[] = await new Promise((resolve, reject) => {
      db.all('SELECT id, url, events FROM Webhooks WHERE events LIKE ?', [`%${eventType}%`], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });


    for (const webhook of webhooks) {
      const payload: WebhookPayload = {
        timestamp: Date.now(),
        webhookEvent: eventType,
        issue: issueData,
      };

      try {
        console.log(`Attempting to send webhook to ${webhook.url} for event ${eventType}`);
        await axios.post(webhook.url, payload, { headers: { 'Content-Type': 'application/json' } });
        console.log(`Webhook sent successfully to ${webhook.url} for event ${eventType}`);
      } catch (error: any) {
        console.error(`Error sending webhook to ${webhook.url} for event ${eventType}:`, error.message || error);
      }
    }
  } catch (error: any) {
    console.error(`Error querying webhooks for event ${eventType}:`, error.message || error);
  }
}