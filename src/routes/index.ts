// src/routes/index.ts

import express from 'express';
import issueRoutes from './issueRoutes';
import webhookRoutes from './webhookRoutes';

const router = express.Router();

router.use('/issues', issueRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
