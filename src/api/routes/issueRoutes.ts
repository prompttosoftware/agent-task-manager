// src/api/routes/issueRoutes.ts
import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

router.post('/issues', createIssue);

export default router;
