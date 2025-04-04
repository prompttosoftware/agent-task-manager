// src/api/routes/webhook.routes.ts
import express, { Request, Response } from 'express';
import { registerWebhook, deleteWebhook, listWebhooks } from '../controllers/webhook.controller';

const router = express.Router();

// POST /webhooks - Register a new webhook
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    await registerWebhook(req, res);
  } catch (error) {
    console.error('Error registering webhook:', error);
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// DELETE /webhooks/:webhookId - Delete a webhook
router.delete('/webhooks/:webhookId', async (req: Request, res: Response) => {
  try {
    await deleteWebhook(req, res);
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// GET /webhooks - List all registered webhooks
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    await listWebhooks(req, res);
  } catch (error) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

export default router;
