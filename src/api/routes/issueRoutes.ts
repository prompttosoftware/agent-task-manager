import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

router.post('/rest/api/2/issue', createIssue);

export default router;
