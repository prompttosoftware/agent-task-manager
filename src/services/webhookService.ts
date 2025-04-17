// This file will contain the implementation for the webhook service.
import axios from 'axios';
import { Webhook } from '../models/webhook';

interface WebhookPayload {
  timestamp: number;
  webhookEvent: string;
  issue: any;
}

export async function triggerWebhooks(eventType: string, issueData: any) {
  try {
    const webhooks = await Webhook.findAll({ where: { eventType } });

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
