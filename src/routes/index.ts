// src/routes/index.ts
import express from 'express';
import { createWebhook } from '../controllers/webhookController';
const router = express.Router();

// Issue Routes
router.post('/webhook', createWebhook);

export default router;
