import { Request, Response } from 'express';
import { createWebhook, deleteWebhook, getAllWebhooks } from '../services/webhook.service';
import { WebhookRegisterRequest } from '../types/webhook.d';

export const registerWebhook = async (req: Request, res: Response) => {  
  try {
    const webhookData: WebhookRegisterRequest = req.body;

    // Input validation
    if (!webhookData.callbackUrl) {
      return res.status(400).json({ message: 'callbackUrl is required' });
    }

    try {
      const url = new URL(webhookData.callbackUrl);
      if (url.protocol !== 'https:') {
        return res.status(400).json({ message: 'callbackUrl must use HTTPS' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid callbackUrl format' });
    }

    if (!webhookData.events || !Array.isArray(webhookData.events) || webhookData.events.length === 0) {
      return res.status(400).json({ message: 'events is required and must be a non-empty array' });
    }

    if (!webhookData.events.every(event => typeof event === 'string' && event.trim() !== '')) {
      return res.status(400).json({ message: 'events must be an array of non-empty strings' });
    }

    if (webhookData.secret && typeof webhookData.secret !== 'string') {
      return res.status(400).json({ message: 'secret must be a string' });
    }

    const newWebhook = await createWebhook(webhookData);
    res.status(201).json(newWebhook);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    if (!webhookId) {
      return res.status(400).json({ message: 'webhookId is required' });
    }
    if (typeof webhookId !== 'string') {
      return res.status(400).json({ message: 'webhookId must be a string' });
    }
    await deleteWebhook(webhookId);
    res.status(204).send(); // No content
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const listWebhooks = async (req: Request, res: Response) => {
  try {
    const webhooks = await getAllWebhooks();
    res.status(200).json(webhooks);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
