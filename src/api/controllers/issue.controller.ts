// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as issueService from '../services/issue.service';
import { Issue } from '../types/issue';
import { issueValidator } from '../validators/issue.validator';

export class IssueController {
  static async getIssue(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const issueKey = req.params.issueKey;
      const issue = await issueService.getIssueByKey(issueKey);

      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      res.status(200).json(issue);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Failed to get issue', error: error.message });
    }
  }

  static async createIssue(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const issueData: Issue = req.body;
      const newIssue = await issueService.addIssue(issueData);

      res.status(201).json(newIssue);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create issue', error: error.message });
    }
  }

  static async updateIssue(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const issueKey = req.params.issueKey;
      const issueData: Partial<Issue> = req.body;
      const updatedIssue = await issueService.updateIssue(issueKey, issueData);

      if (!updatedIssue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      res.status(200).json(updatedIssue);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update issue', error: error.message });
    }
  }

  static async deleteIssue(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const issueKey = req.params.issueKey;
      await issueService.deleteIssue(issueKey);

      res.status(204).send(); // No content
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Failed to delete issue', error: error.message });
    }
  }

  static async updateAssignee(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const issueKey = req.params.issueKey;
      const { assignee } = req.body;
      const updatedIssue = await issueService.updateAssignee(issueKey, assignee);

      if (!updatedIssue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      res.status(200).json(updatedIssue);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update assignee', error: error.message });
    }
  }
}
