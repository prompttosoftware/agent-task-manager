/**
 * Represents a webhook configuration.
 * Webhooks allow external services to be notified about events happening in the system.
 */
export interface Webhook {
  /**
   * The unique identifier for the webhook.
   * Must be a positive integer.
   */
  id: number;

  /**
   * The URL endpoint where the webhook events will be sent.
   * Must be a valid and non-empty URL (starting with http:// or https://).
   */
  url: string;

  /**
   * A list of event types that trigger this webhook.
   * Must be a non-empty array of strings.
   * Example: ['issue.created', 'issue.updated']
   */
  events: string[];

  /**
   * A secret token used to verify the authenticity of incoming webhook requests (optional).
   * Must be a non-empty string if provided.
   */
  secret: string;
}
