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
