// src/routes/issueRoutes.ts
import express, { Request, Response } from 'express';
import * as issueController from '../controllers/issueController';

const router = express.Router();

router.get('/:id', issueController.findIssue);
router.get('/board/:boardId', issueController.getIssuesForBoard);
router.post('/', issueController.addIssue);
router.put('/:id/transition', issueController.transitionIssue);
router.delete('/:id', issueController.deleteIssue);
router.put('/:id/assignee', issueController.updateAssignee);
router.get('/metadata/create', issueController.getIssueCreateMetadata);
router.get('/:id/transitions', issueController.listTransitions);
router.post('/:id/link', issueController.issueLink);
router.post('/:id/attachment', issueController.addAttachment);

export default router;