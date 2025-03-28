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

export interface WebhookService {
  registerWebhook(request: WebhookRegisterRequest): Promise<WebhookRegisterResponse>;
  deleteWebhook(webhookId: string): Promise<WebhookDeleteResponse>;
  listWebhooks(): Promise<WebhookListResponse>;
}

// Define request and response types for the API endpoints

// POST /api/webhooks (Register)
export interface RegisterWebhookRequest extends WebhookRegisterRequest {}

export interface RegisterWebhookResponse extends WebhookRegisterResponse {}

// DELETE /api/webhooks/:webhookId (Delete)
export interface DeleteWebhookResponse {
  id: string;
  status: string;
}

// GET /api/webhooks (List)
export interface ListWebhooksResponse {
  webhooks: Webhook[];
}
