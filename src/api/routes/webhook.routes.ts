// src/api/routes/webhook.routes.ts
import express, { Request, Response } from 'express';
import { registerWebhook, removeWebhook, listWebhooks, simulateEvent } from '../controllers/webhook.controller';

const router = express.Router();

// Route to register a new webhook
router.post('/register', registerWebhook);

// Route to delete a webhook by ID
router.delete('/:id', removeWebhook);

// Route to list all registered webhooks
router.get('/', listWebhooks);

// Route to simulate an event and trigger webhooks (example)
router.post('/simulate', simulateEvent);

export default router;