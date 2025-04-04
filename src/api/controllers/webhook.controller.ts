import { Request, Response } from 'express';
import { register, remove, list } from '../services/webhook.service';
import { validationResult } from 'express-validator';

// POST /api/webhooks - Register webhook
export const registerWebhook = async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    const result = await register(webhookData);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error registering webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to register webhook' });
  }
};

// DELETE /api/webhooks/:webhookId - Delete webhook
export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const webhookId = req.params.webhookId;
    await remove(webhookId);
    res.status(204).send(); // No content on success
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to delete webhook' });
  }
};

// GET /api/webhooks - List webhooks
export const listWebhooks = async (req: Request, res: Response) => {
  try {
    const webhooks = await list();
    res.status(200).json(webhooks);
  } catch (error: any) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ error: error.message || 'Failed to list webhooks' });
  }
};
