import express from 'express';
import { createIssue } from '../controllers/issueController';
import { Request, Response } from 'express';

const router = express.Router();

router.post('/rest/api/2/issue', (req: Request, res: Response) => {
    createIssue(req, res);
});

export default router;
