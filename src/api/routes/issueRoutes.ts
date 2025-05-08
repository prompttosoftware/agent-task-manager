import express from 'express';
import { databaseService } from '../../services/database';
import { IssueController } from '../controllers/issueController';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';

const router = express.Router();

const issueKeyService = new IssueKeyService(databaseService);
const issueStatusTransitionService = new IssueStatusTransitionService(databaseService);
const issueController = new IssueController(databaseService, issueKeyService, issueStatusTransitionService);

router.post('/', issueController.createIssue);
router.get('/:issueIdOrKey', issueController.getIssue);
router.put('/:issueIdOrKey', issueController.updateIssue);
router.delete('/:issueIdOrKey', issueController.deleteIssue);

export default router;