import express from 'express';
import { Request, Response } from 'express';
import { IssueController } from '../api/controllers/issueController';
import { DatabaseService } from '../services/databaseService';
import { IssueStatusTransitionService } from '../services/issueStatusTransitionService';
import { JsonTransformer } from '../utils/jsonTransformer';

const router = express.Router();

const databaseService = new DatabaseService(); // Assuming default constructor
const issueStatusTransitionService = new IssueStatusTransitionService(); // Assuming default constructor
const jsonTransformer = new JsonTransformer();
const issueController = new IssueController(databaseService, issueStatusTransitionService, jsonTransformer);

// POST /rest/api/3/issue - Create Issue
router.post('/', (req: Request, res: Response) => {
  // Implement issue creation logic here
  res.status(201).send({ message: 'Issue created' });
});

// GET /rest/api/3/issue/:id - Get Issue by ID
router.get('/:id', (req: Request, res: Response) => {
  const issueId = req.params.id;
  // Implement issue retrieval logic here
  res.status(200).send({ id: issueId, message: 'Issue retrieved' });
});

// DELETE /rest/api/3/issue/:id - Delete Issue by ID
router.delete('/:id', (req: Request, res: Response) => {
  const issueId = req.params.id;
  // Implement issue deletion logic here
  res.status(200).send({ id: issueId, message: 'Issue deleted' });
});

// GET /:issueIdOrKey/transitions
router.get('/:issueIdOrKey/transitions', issueController.getTransitions.bind(issueController));

// POST /:issueIdOrKey/transitions
router.post('/:issueIdOrKey/transitions', issueController.transitionIssue.bind(issueController));

export default router;
