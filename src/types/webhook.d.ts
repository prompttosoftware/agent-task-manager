// Define the types for webhook data

export interface WebhookRegistration {
  url: string;
  events: string[];
  secret?: string; // Optional secret for verification
  // Add other registration parameters as needed
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string; // Stored secret
  // Add other webhook properties as needed
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
  status: string; // e.g., 'active', 'inactive'
}

export interface WebhookDeleteResponse {
  message: string;
  webhookId: string;
  success: boolean;
}

export interface WebhookListResponse {
  webhooks: Webhook[];
  total: number;
}

export interface WebhookPayload {
  event: string; // Example: 'issue_created', 'issue_updated'
  data: any;    // Example:  Details of the event (e.g., issue details)
  timestamp: string;
  webhookId: string;
}
