import { Request, Response } from 'express';
import { enqueueWebhook } from '../../src/services/webhookProcessing';

interface WebhookRequest {
  url: string;
  method: string;
  headers?: { [key: string]: string };
  body?: any;
}

export async function triggerWebhook(req: Request, res: Response) {
  const webhookData: WebhookRequest = req.body;

  try {
    await enqueueWebhook(webhookData);
    res.status(202).send({ message: 'Webhook enqueued for processing.' });
  } catch (error) {
    console.error('Error enqueueing webhook:', error);
    res.status(500).send({ message: 'Failed to enqueue webhook.' });
  }
}
