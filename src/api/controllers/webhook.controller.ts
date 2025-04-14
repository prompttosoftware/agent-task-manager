// src/api/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import * as webhookService from '../services/webhook.service';

// Define controller methods here

export const handleWebhookEvent = async (req: Request, res: Response) => {
  // Controller logic
  try {
    // Example: Delegate processing to webhookService
    await webhookService.processEvent(req.body);
    res.status(200).send('Event processed successfully');
  } catch (error: any) {
    console.error('Error processing webhook event:', error);
    res.status(500).send('Internal Server Error');
  }
};
