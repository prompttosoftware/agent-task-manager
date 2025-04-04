// src/api/controllers/webhook.controller.ts

import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';
import { Webhook } from '../api/models/webhook'; // Correct import path
import { validationResult, body, param } from 'express-validator';
import { addWebhookJob } from '../../src/services/webhookQueue';
import { EventType } from '../types/webhook.d';

const webhookService = new WebhookService();

export async function createWebhook(req: Request, res: Response) {
    try {
        await body('url').isURL().withMessage('Invalid URL').run(req);
        await body('events').isArray({ min: 1 }).withMessage('At least one event is required').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const webhookData: Webhook = req.body;
        const newWebhook = await webhookService.createWebhook(webhookData);
        res.status(201).json(newWebhook);
    } catch (error: any) {
        console.error("Error creating webhook:", error);
        res.status(500).json({ error: error.message || 'Failed to create webhook' });
    }
}

export async function listWebhooks(req: Request, res: Response) {
    try {
        const webhooks = await webhookService.listWebhooks();
        res.status(200).json(webhooks);
    } catch (error: any) {
        console.error("Error listing webhooks:", error);
        res.status(500).json({ error: 'Failed to retrieve webhooks' });
    }
}

export async function getWebhook(req: Request, res: Response) {
    try {
        await param('id').isUUID().withMessage('Invalid ID').run(req);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const webhook = await webhookService.getWebhook(id);

        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        res.status(200).json(webhook);
    } catch (error: any) {
        console.error("Error getting webhook:", error);
        res.status(500).json({ error: 'Failed to retrieve webhook' });
    }
}

export async function updateWebhook(req: Request, res: Response) {
    try {
        await param('id').isUUID().withMessage('Invalid ID').run(req);
        await body('url').optional().isURL().withMessage('Invalid URL').run(req);
        await body('events').optional().isArray({ min: 1 }).withMessage('At least one event is required').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const webhookData: Webhook = req.body;
        const updatedWebhook = await webhookService.updateWebhook(id, webhookData);

        if (!updatedWebhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        res.status(200).json(updatedWebhook);
    } catch (error: any) {
        console.error("Error updating webhook:", error);
        res.status(500).json({ error: 'Failed to update webhook' });
    }
}

export async function deleteWebhook(req: Request, res: Response) {
    try {
        await param('id').isUUID().withMessage('Invalid ID').run(req);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        await webhookService.deleteWebhook(id);
        res.status(204).send(); // No content on successful delete
    } catch (error: any) {
        console.error("Error deleting webhook:", error);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
}


// Example of how to trigger a webhook.  This is a placeholder and needs to be integrated into the application logic.
export async function triggerWebhook(eventType: EventType, data: any) {
    try {
        const webhooks = await webhookService.listWebhooks();
        webhooks.forEach(webhook => {
            if (webhook.events.includes(eventType)) {
                addWebhookJob({
                    url: webhook.url,
                    event: eventType,
                    data: data
                });
            }
        });
    } catch (error: any) {
        console.error("Error triggering webhook:", error);
    }
}
