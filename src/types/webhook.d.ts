// Define the types for webhook data

export interface WebhookRegistration {
  url: string;
  events: string[];
  // Add other registration parameters as needed
}

export interface WebhookPayload {
  // Define the structure of the payload here based on your needs
  event: string; // Example: 'issue_created', 'issue_updated'
  data: any;    // Example:  Details of the event (e.g., issue details)
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  // Add other webhook properties as needed
}
