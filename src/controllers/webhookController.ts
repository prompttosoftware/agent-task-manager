// src/controllers/webhookController.ts
import { Request, Response } from 'express';
import { registerWebhook } from '../services/webhookService';

export async function createWebhook(req: Request, res: Response) {
  try {
    const webhook = await registerWebhook(req.body);
    res.status(201).json({
      name: webhook.name,
      id: webhook.id
    });
  } catch (error: any) {
    if (error.message === 'Bad Request') {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
