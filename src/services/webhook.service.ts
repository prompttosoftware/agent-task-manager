// src/services/webhook.service.ts

/**
 * Interface for a webhook event.
 */
interface WebhookEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

/**
 * In-memory webhook queue.
 */
const webhookQueue: WebhookEvent[] = [];

/**
 * Adds a webhook event to the queue.
 * @param event The webhook event to add.
 */
export const addWebhookEvent = (event: WebhookEvent): void => {
  webhookQueue.push(event);
  console.log(`Webhook event added to queue. Current queue length: ${webhookQueue.length}`);
};

/**
 * Processes the next webhook event in the queue.
 * @returns True if an event was processed, false otherwise.
 */
export const processNextWebhookEvent = async (): Promise<boolean> => {
  if (webhookQueue.length === 0) {
    console.warn("No webhook events to process.");
    return false;
  }

  const event = webhookQueue.shift();

  if (!event) {
    console.error("Error: Could not retrieve event from queue.");
    return false;
  }

  try {
    console.log("Processing webhook event:", event);
    return true;
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return false;
  }
};

/**
 * Gets the current length of the webhook queue.
 * @returns The length of the queue.
 */
export const getWebhookQueueLength = (): number => {
  return webhookQueue.length;
};

// The following are dummy functions.  They MUST be implemented.
export const sendToExternalService = async (webhookUrl: string, payload: any): Promise<any> => {
    console.log(`Sending to external service: ${webhookUrl} with payload ${payload}`);
    return;
}

export const enqueueWebhook = (payload: any): void => {
    console.log(`Enqueuing webhook with payload: ${payload}`);
    return;
}

export const processWebhook = async (webhookUrl: string): Promise<any> => {
    console.log(`Processing webhook for URL: ${webhookUrl}`);
    return;
}

export const getDeadLetterQueue = (): any[] => {
    console.log(`Getting dead letter queue`);
    return [];
}

export const getWebhookQueueSize = (): number => {
    console.log(`Getting webhook queue size`);
    return 0;
}
