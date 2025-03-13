// src/routes/index.ts
import express from 'express';
import * as issueController from '../controllers/issueController';

const router = express.Router();

router.post('/issue', issueController.createIssue);

export default router;
