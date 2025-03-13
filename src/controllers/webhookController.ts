// src/controllers/webhookController.ts
import { Request, Response } from 'express';
import { deleteWebhook } from '../services/webhookService';

export const deleteWebhookHandler = async (req: Request, res: Response) => {
  const { webhookID } = req.params;

  try {
    await deleteWebhook(webhookID);
    res.status(204).send(); // No Content
  } catch (error: any) {
    if (error.message === 'Webhook not found') {
      res.status(404).json({ message: 'Webhook not found' });
    } else if (error.message === 'Invalid webhookID') {
      res.status(400).json({ message: 'Invalid webhookID format' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
