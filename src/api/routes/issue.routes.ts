// src/api/controllers/issue.controller.ts

// Placeholder for issue controller
console.log('Issue controller initialized');

import { Request, Response } from 'express';
import { Issue } from '../../types/issue'; // Import the Issue type

// In-memory storage for issues (replace with a database in a real application)
let issues: Issue[] = [];

// Create a new issue
export const createIssue = (req: Request, res: Response) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const newIssue: Issue = {
    id: String(Date.now()), // Simple ID generation (replace with UUID in production)
    description,
  };

  issues.push(newIssue);
  res.status(201).json(newIssue); // 201 Created
};

// Get all issues
export const getAllIssues = (req: Request, res: Response) => {
  res.status(200).json(issues);
};

// Get a specific issue by ID
export const getIssueById = (req: Request, res: Response) => {
  const { id } = req.params;
  const issue = issues.find((issue) => issue.id === id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  res.status(200).json(issue);
};

// Update an existing issue
export const updateIssue = (req: Request, res: Response) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const issueIndex = issues.findIndex((issue) => issue.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issues[issueIndex] = { ...issues[issueIndex], description }; // Update only the description.  Keep the id.
  res.status(200).json(issues[issueIndex]);
};

// Delete an issue
export const deleteIssue = (req: Request, res: Response) => {
  const { id } = req.params;
  const issueIndex = issues.findIndex((issue) => issue.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issues.splice(issueIndex, 1);
  res.status(204).send(); // 204 No Content (successful deletion)
};