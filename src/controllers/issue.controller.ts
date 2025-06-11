import { Request, Response } from 'express';
import { createIssueSchema, CreateIssueInput } from './schemas/issue.schema';
import { IssueService } from '../services/issue.service';
import logger from '../utils/logger';
import util from 'util';

export class IssueController {
  private issueService: IssueService;

  constructor(issueService: IssueService) {
    this.issueService = issueService;
  }

  async createIssue(req: Request, res: Response): Promise<void> {
    try {
      const validatedData: CreateIssueInput = createIssueSchema.parse(req.body);
      console.log('validatedData:', validatedData); // Add this line
      const issue = await this.issueService.create(validatedData);
      res.status(201).json({ message: 'Issue created', data: issue });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        logger.error('Error creating issue:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    }
  }

  async getIssue(req: Request, res: Response): Promise<void> {
    try {
      const issueKey = req.params.issueKey;
      const issue = await this.issueService.findByKey(issueKey);

      if (!issue) {
        res.status(404).json({ message: 'Issue not found' });
        return;
      }

      res.status(200).json({ data: issue });
    } catch (error: any) {
      logger.error(`Error getting issue with key ${req.params.issueKey}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteIssue(req: Request, res: Response): Promise<void> {
    try {
      const issueKey = req.params.issueKey;
      const deleted = await this.issueService.deleteByKey(issueKey);

      if (!deleted) {
        res.status(404).json({ message: 'Issue not found' });
        return;
      }

      res.status(204).send(); // No content needed for successful deletion
    } catch (error: any) {
      logger.error(`Error deleting issue with key ${req.params.issueKey}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
