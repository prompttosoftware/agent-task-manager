import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

// Define the route for creating an issue
router.post('/rest/api/2/issue', createIssue);

export default router;
