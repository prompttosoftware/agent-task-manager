// src/routes/index.ts
import express from 'express';
import { getIssue } from '../controllers/issueController';

const router = express.Router();

router.get('/issue/:issueNumber', getIssue);

export default router;
