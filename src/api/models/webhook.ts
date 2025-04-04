// src/api/models/webhook.ts

export interface Webhook {
  url: string;
  events: string[];
  active: boolean;
}