import { Request, Response } from 'express';
import * as webhookService from '../services/webhook.service';

// POST /webhooks - Create a new webhook subscription
export const registerWebhook = async (reqBody: any) => {
  try {
    const webhook = await webhookService.createWebhook(reqBody);
    return webhook;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to register webhook in controller');
  }
};

// DELETE /webhooks/:webhookId - Delete a webhook
export const deleteWebhook = async (webhookId: string) => {
  try {
    await webhookService.removeWebhook(webhookId);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete webhook in controller');
  }
};

// GET /webhooks - List all webhooks
export const listWebhooks = async () => {
  try {
    const webhooks = await webhookService.getAllWebhooks();
    return webhooks;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to list webhooks in controller');
  }
};
