// Define types and interfaces for webhooks

export interface WebhookPayload {
  // Define the structure of the webhook payload here.  This will depend on the specific webhook service.
  // Example:
  url: string;
  eventType: string;
  // Add other relevant fields here, e.g., headers, secret, etc.
}

export interface Webhook {
  id: number;
  url: string;
  eventType: string;
  // Add other fields as needed
}
