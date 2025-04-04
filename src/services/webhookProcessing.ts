import { Queue } from 'bull';
import { createQueue } from '../config';

interface WebhookPayload {
  url: string;
  method: string;
  headers?: { [key: string]: string };
  body?: any;
}

const webhookQueue: Queue<WebhookPayload> = createQueue('webhook-queue');

export async function enqueueWebhook(payload: WebhookPayload): Promise<void> {
  await webhookQueue.add(payload);
}

export async function processWebhook(job: any): Promise<void> {
  const payload = job.data;
  try {
    const response = await fetch(payload.url, {
      method: payload.method,
      headers: payload.headers,
      body: JSON.stringify(payload.body),
    });
    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} - ${await response.text()}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
}

webhookQueue.process(processWebhook);
