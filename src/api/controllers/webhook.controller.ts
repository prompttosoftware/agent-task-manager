import { Request, Response } from 'express';
import { createWebhook, deleteWebhook, getAllWebhooks } from '../services/webhook.service';

export const registerWebhook = async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    const newWebhook = await createWebhook(webhookData);
    res.status(201).json(newWebhook);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    await deleteWebhook(webhookId);
    res.status(204).send(); // No content
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const listWebhooks = async (req: Request, res: Response) => {
  try {
    const webhooks = await getAllWebhooks();
    res.status(200).json(webhooks);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
