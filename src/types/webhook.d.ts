// Define types and interfaces for webhooks

export interface WebhookRegisterRequest {
  callbackUrl: string;
  secret?: string;
  events: string[];
}

export interface WebhookRegisterResponse {
  id: string;
  callbackUrl: string;
  events: string[];
  status: string; // e.g., 'active', 'inactive'
}

export interface WebhookDeleteResponse {
  id: string;
  status: string; // e.g., 'deleted'
}

export interface Webhook {
  id: string;
  callbackUrl: string;
  secret?: string;
  events: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookListResponse {
  webhooks: Webhook[];
}
