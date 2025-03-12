// src/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';

export class WebhookController {
    private webhookService: WebhookService;

    constructor() {
        this.webhookService = new WebhookService();
    }

    async handleWebhook(req: Request, res: Response) {
        try {
            await this.webhookService.processWebhook(req.body);
            res.status(200).send('Webhook received');
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: error.message || 'Failed to process webhook' });
        }
    }
}
