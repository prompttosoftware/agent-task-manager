// src/services/webhookService.ts

import { v4 as uuidv4 } from 'uuid';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  filters?: object; // Consider a more specific type for filters
}

export class WebhookService {
  private webhooks: Webhook[] = [];

  // Webhook Registration
  registerWebhook(name: string, url: string, events: string[], filters?: object): Webhook {
    const webhookId = uuidv4();
    const newWebhook: Webhook = {
      id: webhookId,
      name,
      url,
      events,
      filters,
    };
    this.webhooks.push(newWebhook);
    return newWebhook;
  }

  // Webhook Triggering
  async triggerWebhook(event: string, issue: any): Promise<void> {
    for (const webhook of this.webhooks) {
      if (webhook.events.includes(event)) {
        // Implement filter matching here if filters are present
        if (this.matchesFilters(issue, webhook.filters)) {
          try {
            await this.sendWebhook(webhook.url, { event, issue });
          } catch (error) {
            console.error(`Error sending webhook to ${webhook.url}:`, error);
            // Implement more robust error logging
          }
        }
      }
    }
  }

    private matchesFilters(issue: any, filters?: object): boolean {
        if (!filters) {
            return true; // No filters, so always match
        }
    
        // Implement filter matching logic here
        // This is a placeholder, needs to be customized based on filter structure
        return true;
    }


  private async sendWebhook(url: string, payload: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // Webhook Listing
  getWebhooks(): Webhook[] {
    return this.webhooks;
  }

  // Webhook Deletion
  deleteWebhook(webhookId: string): boolean {
    const initialLength = this.webhooks.length;
    this.webhooks = this.webhooks.filter((webhook) => webhook.id !== webhookId);
    return this.webhooks.length !== initialLength;
  }
}
