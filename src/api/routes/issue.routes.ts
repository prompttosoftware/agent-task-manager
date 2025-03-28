import express from 'express';
import * as issueController from '../api/controllers/issue.controller';

const router = express.Router();

router.get('/', issueController.getAllIssues);

export default router;