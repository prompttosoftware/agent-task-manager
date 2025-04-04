// src/api/types/webhook.d.ts

/**
 * Represents a webhook configuration.
 */
export interface Webhook {
  /**
   * Unique identifier for the webhook.
   */
  id: string;

  /**
   * The URL to which webhook events will be sent.
   */
  callbackUrl: string;

  /**
   * An optional secret used to sign the webhook payloads.  This is used to verify the payloads originated from the server.
   */
  secret?: string;

  /**
   * An array of event types that trigger the webhook.
   */
  events: string[];

  /**
   * The current status of the webhook (e.g., 'active', 'inactive', 'failed').
   */
  status: string;

  /**
   * Date and time when the webhook was created.
   */
  createdAt: string;

  /**
   * Date and time when the webhook was last updated.
   */
  updatedAt: string;

  /**
   * Optional headers that are sent with the webhook request.  These are key-value pairs.
   */
  headers?: { [key: string]: string };
}

/**
 * Represents a request to register a new webhook.
 */
export interface WebhookRegisterRequest {
  /**
   * The URL to which webhook events will be sent.
   */
  callbackUrl: string;

  /**
   * An array of event types that trigger the webhook.
   */
  events: string[];

  /**
   * An optional secret used to sign the webhook payloads.
   */
  secret?: string;

  /**
   * Optional headers that are sent with the webhook request.  These are key-value pairs.
   */
  headers?: { [key: string]: string };
}

/**
 * Represents the response after registering a new webhook.
 */
export interface WebhookRegisterResponse {
  /**
   * Unique identifier for the webhook.
   */
  id: string;

  /**
   * The URL to which webhook events will be sent.
   */
  callbackUrl: string;

  /**
   * An array of event types that trigger the webhook.
   */
  events: string[];

  /**
   * The secret used to sign the webhook payloads.
   */
  secret?: string;

  /**
   * The current status of the webhook.
   */
  status: string;
}

/**
 * Represents the response from a list webhooks request.
 */
export interface WebhookListResponse {
  /**
   * An array of webhook objects.
   */
  webhooks: Webhook[];

  /**
   * The total number of webhooks available.
   */
  total: number;
}

/**
 * Represents the response from a delete webhook request.
 */
export interface WebhookDeleteResponse {
  /**
   * A message indicating the result of the deletion.
   */
  message: string;

  /**
   * The ID of the deleted webhook.
   */
  webhookId: string;

  /**
   * Whether the deletion was successful.
   */
  success: boolean;
}

/**
 * Represents the payload sent in a webhook event.
 */
export interface WebhookPayload {
  /**
   * The type of event that triggered the webhook.
   */
  event: string;

  /**
   * The data associated with the event.
   */
  data: any;

  /**
   * The ID of the webhook that received the event.
   */
  webhookId: string;

  /**
   * The timestamp of the event.
   */
  timestamp: string;
}