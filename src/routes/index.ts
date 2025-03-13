// src/routes/index.ts

import { Router } from 'express';
import * as issueController from '../controllers/issueController';

const router = Router();

router.put('/issue/:issueKey/assignee', issueController.updateIssueAssignee);

export default router;
