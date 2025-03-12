// src/models/webhook.ts

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  active: boolean;
}
