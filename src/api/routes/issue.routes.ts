// src/api/routes/issue.routes.ts

import express from 'express';
import * as issueController from '../api/controllers/issue.controller';

const router = express.Router();

router.post('/issues', issueController.createIssue);
router.get('/issues/:id', issueController.getIssue);
router.put('/issues/:id', issueController.updateIssue);
router.delete('/issues/:id', issueController.deleteIssue);

export default router;