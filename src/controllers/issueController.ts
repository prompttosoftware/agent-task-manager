// src/controllers/issueController.ts

import { Request, Response } from 'express';
import * as issueService from '../services/issueService';

export const updateIssueAssignee = (req: Request, res: Response) => {
  const { issueKey } = req.params;
  const { agentId } = req.body;

  if (!issueKey || !agentId) {
    return res.status(400).send({ message: 'issueKey and agentId are required' });
  }

  const updated = issueService.updateIssueAssignee(issueKey, agentId);

  if (!updated) {
    return res.status(404).send({ message: 'Issue not found' });
  }

  res.status(204).send();
};
