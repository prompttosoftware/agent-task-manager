import express from 'express';
import { triggerWebhook } from '../api/controllers/webhook.controller';

const router = express.Router();

router.post('/webhooks', triggerWebhook);

export default router;
