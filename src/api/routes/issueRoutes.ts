import express from 'express';
import { issueController } from '../controllers/issueController';

const router = express.Router();

router.post('/', issueController.createIssue);
router.get('/:issueIdOrKey', issueController.getIssue);
router.put('/:issueIdOrKey', issueController.updateIssue);
router.delete('/:issueIdOrKey', issueController.deleteIssue);

export default router;