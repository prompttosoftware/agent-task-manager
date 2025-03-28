import express, { Request, Response } from 'express';
import * as webhookController from '../controllers/webhook.controller';

const router = express.Router();

// POST /webhooks - Create a new webhook subscription
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const result = await webhookController.registerWebhook(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error registering webhook:', error);
    res.status(500).json({ message: error.message || 'Failed to register webhook' });
  }
});

// DELETE /webhooks/:webhookId - Delete a webhook
router.delete('/webhooks/:webhookId', async (req: Request, res: Response) => {
  try {
    const webhookId = req.params.webhookId;
    await webhookController.deleteWebhook(webhookId);
    res.status(204).send(); // No content
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ message: error.message || 'Failed to delete webhook' });
  }
});

// GET /webhooks - List all webhooks
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const webhooks = await webhookController.listWebhooks();
    res.status(200).json(webhooks);
  } catch (error: any) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ message: error.message || 'Failed to list webhooks' });
  }
});

export default router;
