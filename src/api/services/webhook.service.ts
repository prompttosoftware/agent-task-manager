// src/api/services/webhook.service.ts
import { WebhookRegisterRequest, Webhook, WebhookPayload } from '../types/webhook.d';
import { createWebhook, getWebhook, listWebhooks, deleteWebhook, triggerWebhooks } from '../../src/services/webhookProcessing';
import { WebhookWorker } from '../../src/services/webhookWorker';

const webhookWorker = new WebhookWorker();

export async function registerWebhook(webhookData: WebhookRegisterRequest): Promise<Webhook> {
    return createWebhook(webhookData);
}

export async function getWebhookById(id: string): Promise<Webhook | undefined> {
    return getWebhook(id);
}

export async function getAllWebhooks(): Promise<Webhook[]> {
    return listWebhooks();
}

export async function removeWebhook(id: string): Promise<boolean> {
    return deleteWebhook(id);
}

export async function processEvent(event: string, data: any): Promise<void> {
    await triggerWebhooks(event, data);
}

// Example of how to enqueue payloads from other services or controllers
export function enqueueWebhook(payload: WebhookPayload): void {
  webhookWorker.enqueue(payload);
}