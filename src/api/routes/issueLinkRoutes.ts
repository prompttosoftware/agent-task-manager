import { Router, Request, Response } from 'express';
import * as issueController from '../controllers/issueController';

const router = Router();

router.post('/', issueController.linkIssues);

export default router;
