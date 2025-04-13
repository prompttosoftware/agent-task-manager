// src/api/services/webhook.service.ts
import { Webhook } from '../../src/types/webhook.d';
import { v4 as uuidv4 } from 'uuid';

// Mock database (replace with actual database interaction in production)
const webhooks: Webhook[] = [];

export const createWebhook = async (url: string, eventType: string): Promise<Webhook> => {
  if (!url || !eventType) {
    throw new Error('URL and eventType are required');
  }
  const newWebhook: Webhook = {
    id: uuidv4(),
    url,
    eventType,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  webhooks.push(newWebhook);
  return newWebhook;
};

export const deleteWebhook = async (id: string): Promise<void> => {
  const index = webhooks.findIndex((webhook) => webhook.id === id);
  if (index === -1) {
    throw new Error(`Webhook with id ${id} not found`);
  }
  webhooks.splice(index, 1);
};

export const getAllWebhooks = async (): Promise<Webhook[]> => {
  return webhooks;
};
