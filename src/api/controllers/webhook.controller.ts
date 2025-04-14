// src/api/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { webhookQueue } from '../utils/webhookQueue';

// Define the expected structure of the webhook data.  Adjust as needed.
interface WebhookData {
    [key: string]: any; // Allows any properties
}

export const handleWebhook = async (req: Request, res: Response) => {
    // Basic validation: Check if the request body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Error: Request body is empty.' });
    }

    try {
        // Type assertion to ensure type safety
        const webhookData: WebhookData = req.body;
        webhookQueue.enqueue(webhookData);
        res.status(202).json({ message: 'Webhook data successfully enqueued for processing.' });
    } catch (error: any) {
        console.error('Error enqueuing webhook data:', error);
        res.status(500).json({ message: 'Failed to enqueue webhook data.', error: error.message });
    }
};
