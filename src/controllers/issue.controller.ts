// src/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { IssueService } from '../services/issue.service';
import { IssueRepository } from '../repositories/issue.repository';
import { Issue } from '../models/issue.model';

export class IssueController {
  private issueService: IssueService;

  constructor() {
    this.issueService = new IssueService(new IssueRepository());
  }

  async createIssue(req: Request, res: Response) {
    try {
      const issueData: Partial<Issue> = req.body;
      const issue = await this.issueService.createIssue(issueData);
      res.status(201).json(issue);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Failed to create issue' });
    }
  }

  async getIssueById(req: Request, res: Response) {
    try {
      const issueId = parseInt(req.params.id, 10);
      const issue = await this.issueService.getIssueById(issueId);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.status(200).json(issue);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Failed to get issue' });
    }
  }

  async updateIssue(req: Request, res: Response) {
    try {
      const issueId = parseInt(req.params.id, 10);
      const issueData: Partial<Issue> = req.body;
      const issue = await this.issueService.updateIssue(issueId, issueData);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.status(200).json(issue);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Failed to update issue' });
    }
  }

  async deleteIssue(req: Request, res: Response) {
    try {
      const issueId = parseInt(req.params.id, 10);
      await this.issueService.deleteIssue(issueId);
      res.status(204).send(); // No Content
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Failed to delete issue' });
    }
  }
}
