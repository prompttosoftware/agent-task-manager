// src/api/routes/issue.routes.ts
import { Router } from 'express';
import { IssueController } from '../api/controllers/issue.controller';
import { IssueService } from '../services/issue.service';
import { BoardService } from '../services/board.service';

export const createIssueRoutes = () => {
  const router = Router();
  const issueService = new IssueService();
  const boardService = new BoardService();
  const issueController = new IssueController(issueService, boardService);

  router.get('/issues/search', issueController.searchIssues.bind(issueController));
  router.get('/issues/:issueKey', issueController.getIssue.bind(issueController));
  router.get('/boards/:boardId/issues', issueController.getIssuesByBoard.bind(issueController));
  router.post('/issues', issueController.addIssue.bind(issueController));
  router.put('/issues/:issueKey', issueController.updateIssue.bind(issueController));
  router.delete('/issues/:issueKey', issueController.deleteIssue.bind(issueController));
  router.post('/issues/:issueKey/attachments', issueController.addAttachment.bind(issueController));
  router.post('/issuelinks', issueController.linkIssue.bind(issueController));
  router.put('/issues/:issueKey/assignee', issueController.assignIssue.bind(issueController));
  router.post('/issues/:issueKey/transitions', issueController.transitionIssue.bind(issueController));
  router.get('/issue/createmeta', issueController.getCreateMeta.bind(issueController));
  router.get('/issues/:issueKey/transitions', issueController.getTransitions.bind(issueController));

  return router;
};
