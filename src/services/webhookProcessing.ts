// src/services/webhookProcessing.ts
import { Queue } from 'bullmq';
import webhookQueue from './webhookQueue'; // Import the queue instance
import { WebhookPayload } from '../api/types/webhook.d'; // Assuming you have this type defined

// Function to enqueue a webhook for processing
export async function addWebhookJob(url: string, data: any, webhookId: string): Promise<void> {
  try {
    const payload: WebhookPayload = {
      url,
      data,
      webhookId,
      event: "generic_event", // Or derive the event from the data or another parameter
    };

    await webhookQueue.add('webhookJob', payload);
    console.log(`Added webhook job to queue for URL: ${url}, webhookId: ${webhookId}`);
  } catch (error) {
    console.error(`Error adding webhook job to queue for URL: ${url}, webhookId: ${webhookId}:`, error);
    // Consider adding more robust error handling, such as logging to a monitoring service
    throw error; // Re-throw the error to be handled by the caller
  }
}