// src/api/types/webhook.d.ts

export interface Webhook {
  id?: number;
  event: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebhookRegistration {
  event: string;
  url: string;
}

export enum WebhookEvent {
  IssueCreated = 'issue.created',
  IssueUpdated = 'issue.updated',
  IssueDeleted = 'issue.deleted',
  // Add other event types as needed
}
