export interface Webhook {
  id: string;
  callbackUrl: string;
  secret?: string;
  events: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookRegisterRequest {
  callbackUrl: string;
  events: string[];
  secret?: string;
}

export interface WebhookRegisterResponse {
  id: string;
  callbackUrl: string;
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
  data: any;
  webhookId: string;
  timestamp: string;
}
