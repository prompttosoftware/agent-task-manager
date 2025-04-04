// src/api/models/webhook.ts

export interface Webhook {
  id?: string; // Add id to the webhook model
  url: string;
  events: string[];
  active: boolean;
}
