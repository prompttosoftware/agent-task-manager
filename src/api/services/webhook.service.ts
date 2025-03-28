import { WebhookRegistration, WebhookPayload, Webhook } from '../types/webhook';

// In-memory storage for webhooks (replace with a database in a real application)
let webhooks: Webhook[] = [];

export const registerWebhook = (registration: WebhookRegistration): Webhook => {
  const newWebhook: Webhook = {
    id: generateId(), // You'll need to implement this function
    ...registration,
  };
  webhooks.push(newWebhook);
  return newWebhook;
};

export const deleteWebhook = (webhookId: string): boolean => {
  webhooks = webhooks.filter((webhook) => webhook.id !== webhookId);
  return true; // Or return false if not found
};

export const listWebhooks = (): Webhook[] => {
  return webhooks;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const processWebhookEvent = (payload: WebhookPayload): void => {
  const matchingWebhooks = webhooks.filter(webhook => webhook.events.includes(payload.event));

  matchingWebhooks.forEach(webhook => {
    // In a real application, you'd send the payload to the webhook's URL here
    console.log(`Sending event ${payload.event} to ${webhook.url}`);
    // You would typically use a library like 'axios' or 'node-fetch' to make the POST request
  });
};
