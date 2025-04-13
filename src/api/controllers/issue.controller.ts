// src/api/controllers/issue.controller.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as issueService from '../services/issue.service';
import { Issue } from '../types/issue';
import { issueValidator } from '../validators/issue.validator';

// GET /boards/:boardId/issues
export const getIssuesForBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = req.params.boardId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const issues = await issueService.getIssuesForBoard(boardId);
    res.status(200).json(issues);
  } catch (error: any) {
    console.error('Error fetching issues for board:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /issues/:issueKey - Add validation
export const getIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Promise.all(issueValidator.validateIssueKey().map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const issueKey = req.params.issueKey;
    const issue = await issueService.getIssue(issueKey);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.status(200).json(issue);
  } catch (error: any) {
    console.error('Error getting issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /issues
export const addIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Promise.all(issueValidator.validateIssueData().map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const issueData: Issue = req.body;
    const newIssue = await issueService.addIssue(issueData);
    res.status(201).json(newIssue);
  } catch (error: any) {
    console.error('Error adding issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /issues/:issueKey
export const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueKey = req.params.issueKey;
    await Promise.all(issueValidator.validateIssueKey().map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updatedIssueData: Partial<Issue> = req.body;
    const updatedIssue = await issueService.updateIssue(issueKey, updatedIssueData);

    if (!updatedIssue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json(updatedIssue);
  } catch (error: any) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /issues/:issueKey
export const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueKey = req.params.issueKey;
    await issueService.deleteIssue(issueKey);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /issues/search
export const searchIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate search parameters (e.g., query)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const query = req.query.q as string; // Assuming a query parameter 'q'
    const issues = await issueService.searchIssues(query);
    res.status(200).json(issues);
  } catch (error: any) {
    console.error('Error searching issues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /issues/:issueKey/assignee
export const updateAssignee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueKey = req.params.issueKey;
    await Promise.all(issueValidator.validateIssueKey().map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignee } = req.body;

    if (!assignee) {
      return res.status(400).json({ message: 'Assignee is required in the request body' });
    }

    // Implement validation for the assignee (e.g., check if the user exists)
    // For now, assume the assignee is a user key or username

    const updatedIssue = await issueService.updateAssignee(issueKey, assignee);

    if (!updatedIssue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json(updatedIssue);
  } catch (error: any) {
    console.error('Error updating assignee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
