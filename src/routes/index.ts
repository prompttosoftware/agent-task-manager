// src/routes/index.ts
import express from 'express';
import * as issueController from '../controllers/issueController';

const router = express.Router();

router.get('/issue/:issueKey/transitions', issueController.getIssueTransitions);

export default router;
