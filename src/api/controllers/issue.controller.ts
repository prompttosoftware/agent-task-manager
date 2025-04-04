// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import * as issueService from '../services/issue.service';

export const createIssue = async (req: Request, res: Response) => {
  try {
    const issue = await issueService.createIssue(req.body);
    res.status(201).json(issue);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getIssue = async (req: Request, res: Response) => {
  try {
    const issue = await issueService.getIssue(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.status(200).json(issue);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    const issue = await issueService.updateIssue(req.params.id, req.body);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.status(200).json(issue);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    await issueService.deleteIssue(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listIssues = async (req: Request, res: Response) => {
  try {
    const issues = await issueService.listIssues();
    res.status(200).json(issues);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
