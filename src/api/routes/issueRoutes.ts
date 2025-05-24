import express from 'express';
import * as issueController from '../controllers/issueController';

const router = express.Router();

router.post('/rest/api/2/issue', issueController.createIssue);

export default router;
