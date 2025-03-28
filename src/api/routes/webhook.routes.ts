// Import necessary modules
import express from 'express';
import { handleWebhook } from '../controllers/webhook.controller';

const router = express.Router();

// Define webhook routes
router.post('/', handleWebhook);

export default router;
