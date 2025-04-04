// src/api/routes/webhook.routes.ts
import express from 'express';
import { handleWebhook } from '../controllers/webhook.controller';

const router = express.Router();

// POST /webhook - Handles incoming webhook events
router.post('/webhook', handleWebhook);

export default router;