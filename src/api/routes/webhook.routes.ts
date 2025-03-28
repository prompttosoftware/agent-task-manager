import express, { Request, Response } from 'express';
import { registerWebhook, deleteWebhook, listWebhooks } from '../api/services/webhook.service';
import { WebhookRegistration } from '../types/webhook';

const router = express.Router();

// POST /api/webhooks - Register a webhook
router.post('/api/webhooks', (req: Request, res: Response) => {
  try {
    const registration: WebhookRegistration = req.body;
    const newWebhook = registerWebhook(registration);
    res.status(201).json(newWebhook);
  } catch (error: any) {
    console.error('Error registering webhook:', error);
    res.status(500).json({ message: error.message || 'Failed to register webhook' });
  }
});

// DELETE /api/webhooks/:webhookId - Delete a webhook
router.delete('/api/webhooks/:webhookId', (req: Request, res: Response) => {
  try {
    const webhookId = req.params.webhookId;
    const success = deleteWebhook(webhookId);
    if (success) {
      res.status(200).json({ message: 'Webhook deleted successfully' });
    } else {
      res.status(404).json({ message: 'Webhook not found' });
    }
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ message: error.message || 'Failed to delete webhook' });
  }
});

// GET /api/webhooks - List all webhooks
router.get('/api/webhooks', (req: Request, res: Response) => {
  try {
    const webhookList = listWebhooks();
    res.status(200).json(webhookList);
  } catch (error: any) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ message: error.message || 'Failed to list webhooks' });
  }
});

export default router;
