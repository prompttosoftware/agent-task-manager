// src/models/webhook.ts

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  // Add other relevant fields like headers, etc.
}
