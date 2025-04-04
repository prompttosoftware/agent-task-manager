// src/services/webhookProcessing.ts
import { Queue, Job } from 'bull';
import Redis from 'ioredis';
import { WebhookPayload, Webhook } from '../api/types/webhook.d';
import db from '../db/database';
import { sendWebhook } from './webhook.service';
import * as crypto from 'crypto';

// Configure Redis connection
const redisOptions = {
  host: 'localhost',
  port: 6379,
};
const redis = new Redis(redisOptions);

// Create a Bull queue
const webhookQueue: Queue<WebhookPayload> = new Queue<WebhookPayload>('webhook', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3, // Number of retry attempts
    backoff: {
      type: 'exponential',
      delay: 1000, // Initial delay in milliseconds
    },
  },
});

// Function to enqueue a webhook payload
export async function enqueueWebhook(payload: WebhookPayload): Promise<Job<WebhookPayload>> {
  return webhookQueue.add(payload);
}

// Function to get webhook configuration
async function getWebhookConfig(webhookId: string): Promise<Webhook | undefined> {
  try {
    const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(webhookId) as Webhook | undefined;
    return row;
  } catch (error) {
    console.error(`Error fetching webhook config for ID ${webhookId}:`, error);
    return undefined;
  }
}


// Function to sign the payload
function signPayload(secret: string, payload: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

// Define the processing logic for each job
webhookQueue.process(async (job: Job<WebhookPayload>) => {
  const { data: payload } = job;
  const webhookId = payload.webhookId;

  console.log(`Processing webhook for webhookId: ${webhookId}, event: ${payload.event}`);

  const webhookConfig = await getWebhookConfig(webhookId);

  if (!webhookConfig) {
    console.error(`Webhook configuration not found for ID: ${webhookId}`);
    return; // Consider failing the job or retrying based on your needs
  }

  try {
    const requestBody = JSON.stringify(payload);
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (webhookConfig.secret) {
      const signature = signPayload(webhookConfig.secret, requestBody);
      headers['X-Webhook-Signature'] = signature;
    }

    if (webhookConfig.headers) {
      for (const key in webhookConfig.headers) {
        headers[key] = webhookConfig.headers[key];
      }
    }

    await sendWebhook(webhookConfig.callbackUrl, requestBody, headers);
    console.log(`Webhook sent successfully for webhookId: ${webhookId}, event: ${payload.event}`);
    // Optionally update webhook status in DB if needed (e.g., to 'successful')
  } catch (error: any) {
    console.error(`Error sending webhook for webhookId: ${webhookId}, event: ${payload.event}:`, error);
    // Handle errors, potentially update webhook status in DB (e.g., to 'failed')
    throw error; // Re-throw to trigger retry mechanism
  }
});

// Optional: Add a listener for when a job fails
webhookQueue.on('failed', (job: Job<WebhookPayload>, error: Error) => {
  console.error(`Webhook job failed for job ${job.id} with error: ${error.message}`);
  // Potentially update webhook status in the database to 'failed' after all retries are exhausted.
});

// Optional: Start the queue processing here, or in your application entry point.
// This allows the worker to start processing jobs as soon as the application starts.
export async function startWebhookQueue(): Promise<void> {
  console.log("Starting Webhook Queue");
  // This will start processing jobs immediately
}