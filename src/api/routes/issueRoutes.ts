import express from 'express';
import * as issueService from '../../services/issueService.ts';
import { createIssue } from '../controllers/issueController.ts';

const router = express.Router();

router.post('/rest/api/2/issue', createIssue);

export const issueRoutes = router;
