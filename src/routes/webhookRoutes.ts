// src/routes/webhookRoutes.ts
import express from 'express';
import * as webhookService from '../services/webhookService';

const router = express.Router();

router.post('/', (req, res) => {
    try {
        const webhook = webhookService.registerWebhook(req.body);
        res.status(201).json(webhook);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', (req, res) => {
    try {
        const webhooks = webhookService.listWebhooks();
        res.json(webhooks);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const success = webhookService.deleteWebhook(req.params.id);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Webhook not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;