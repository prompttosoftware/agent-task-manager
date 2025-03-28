export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

export interface WebhookRegisterRequest {
  url: string;
  events: string[];
  secret?: string;
}

export interface WebhookRegisterResponse {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  status: string;
}

export interface WebhookListResponse {
  webhooks: Webhook[];
  total: number;
}

export interface WebhookDeleteResponse {
  message: string;
  webhookId: string;
  success: boolean;
}

export interface WebhookPayload {
  event: string;
  [key: string]: any; // Allows for any other data to be sent
}