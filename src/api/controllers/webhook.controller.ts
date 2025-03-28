// Import necessary modules
import { Request, Response } from 'express';
import { processWebhook } from '../services/webhook.service';

// Define the webhook handler
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Process the webhook data using the service
    await processWebhook(req.body);

    // Respond with a success status
    res.status(200).send('Webhook received and processed');
  } catch (error: any) {
    // Log the error and respond with an error status
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};
