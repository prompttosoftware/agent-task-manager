// src/services/webhookService.ts
import { v4 as uuidv4 } from 'uuid';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  filters?: {
    projectKey?: string;
    issueType?: string;
    issueStatus?: string;
    previousIssueStatus?: string;
  };
}

const webhooks: Webhook[] = [];

export async function registerWebhook(webhookData: any): Promise<Webhook> {
  const { name, url, events, filters } = webhookData;

  if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
    throw new Error('Bad Request');
  }

  const newWebhook: Webhook = {
    id: uuidv4(),
    name,
    url,
    events,
    filters,
  };

  webhooks.push(newWebhook);
  return newWebhook;
}
