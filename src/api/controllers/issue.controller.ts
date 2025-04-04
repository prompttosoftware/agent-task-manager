// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as issueService from '../services/issue.service';
import { Issue } from '../types/issue.d';

export const addIssue = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const issueData: Issue = req.body;
    const newIssue = await issueService.createIssue(issueData);
    res.status(201).json(newIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: error.message || 'Failed to create issue' });
  }
};
