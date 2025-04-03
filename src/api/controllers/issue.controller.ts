// src/api/controllers/issue.controller.ts

import { Request, Response } from 'express';
import * as issueService from '../services/issue.service';
import { Issue } from '../../types/issue';
import { IssueLink } from '../../types/issue';

export const createIssue = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const newIssue: Issue = {
      id: String(Date.now()), // Replace with UUID in production
      description,
    };

    const createdIssue = await issueService.createIssue(newIssue);
    res.status(201).json(createdIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: `Failed to create issue. ${error.message}` });
  }
};

export const getAllIssues = async (req: Request, res: Response) => {
  try {
    const allIssues = await issueService.getAllIssues();
    res.status(200).json(allIssues);
  } catch (error: any) {
    console.error('Error getting all issues:', error);
    res.status(500).json({ error: `Failed to get issues. ${error.message}` });
  }
};

export const getIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await issueService.getIssueById(id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json(issue);
  } catch (error: any) {
    console.error('Error getting issue by ID:', error);
    res.status(500).json({ error: `Failed to get issue. ${error.message}` });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const updatedIssue: Issue = {
      id, // Keep the original ID
      description,
    };

    const result = await issueService.updateIssue(updatedIssue);

    if (!result) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: `Failed to update issue. ${error.message}` });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await issueService.deleteIssue(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting issue:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: `Issue not found.` });
    }
    res.status(500).json({ error: `Failed to delete issue. ${error.message}` });
  }
};

export const createIssueLink = async (req: Request, res: Response) => {
  try {
    const issueLink: IssueLink = req.body;
    await issueService.createIssueLink(issueLink);
    res.status(201).send();
  } catch (error: any) {
    console.error('Error creating issue link:', error);
    res.status(500).json({ error: `Failed to create issue link. ${error.message}` });
  }
};
