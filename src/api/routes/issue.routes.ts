// src/api/routes/issue.routes.ts
import { Router } from 'express';
import { findIssues, createIssue } from '../controllers/issue.controller';

const router = Router();

router.get('/issues/search', findIssues);
router.post('/issues', createIssue);

export default router;