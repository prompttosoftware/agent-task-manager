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

export const updateIssue = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        const updateData = req.body;
        const updatedIssue = await issueService.updateIssue(issueId, updateData);
        res.status(200).json(updatedIssue);
    } catch (error: any) {
        console.error('Error updating issue:', error);
        res.status(500).json({ message: error.message || 'Failed to update issue' });
    }
};

export const getIssue = async (req: Request, res: Response) => {
    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        const issue = await issueService.getIssueById(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.status(200).json(issue);
    } catch (error: any) {
        console.error('Error getting issue:', error);
        res.status(500).json({ message: error.message || 'Failed to get issue' });
    }
};

export const deleteIssue = async (req: Request, res: Response) => {
    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        await issueService.deleteIssue(issueId);
        res.status(204).send(); // No content on success
    } catch (error: any) {
        console.error('Error deleting issue:', error);
        res.status(500).json({ message: error.message || 'Failed to delete issue' });
    }
};

export const listIssues = async (req: Request, res: Response) => {
    try {
        const issues = await issueService.listIssues(req.query);
        res.status(200).json(issues);
    } catch (error: any) {
        console.error('Error listing issues:', error);
        res.status(500).json({ message: error.message || 'Failed to list issues' });
    }
};
