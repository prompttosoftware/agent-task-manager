// src/api/routes/issue.routes.ts
import { Router } from 'express';
import { findIssues } from '../controllers/issue.controller';

const router = Router();

router.get('/issues/search', findIssues);

export default router;
