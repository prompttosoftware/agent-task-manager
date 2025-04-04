import { Request, Response } from 'express';
import { validationResult, body, param } from 'express-validator';
import { inject, injectable } from 'tsyringe';
import { IssueService } from '../services/issue.service';
import { WebhookService } from '../services/webhook.service';
import { WebhookEvent } from '../types/webhook.d';

@injectable()
export class IssueController {
  constructor(
    @inject('IssueService') private issueService: IssueService,
    @inject('WebhookService') private webhookService: WebhookService
  ) {}

  async createIssue(req: Request, res: Response) {
    await Promise.all([
      body('title').isString().notEmpty().withMessage('Title is required').trim().escape().isLength({ max: 255 }).withMessage('Title must be less than 255 characters').run(req),
      body('description').optional().isString().trim().escape().run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const issue = await this.issueService.createIssue(req.body);
      await this.webhookService.triggerWebhook(WebhookEvent.IssueCreated, issue);
      res.status(201).json(issue);
    } catch (error: any) {
      console.error('Error creating issue:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getIssue(req: Request, res: Response) {
    await param('id').isUUID().withMessage('Invalid issue ID').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const issue = await this.issueService.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.status(200).json(issue);
    } catch (error: any) {
      console.error('Error getting issue:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateIssue(req: Request, res: Response) {
    await Promise.all([
      param('id').isUUID().withMessage('Invalid issue ID').run(req),
      body('title').optional().isString().trim().escape().isLength({ max: 255 }).withMessage('Title must be less than 255 characters').run(req),
      body('description').optional().isString().trim().escape().run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const issue = await this.issueService.updateIssue(req.params.id, req.body);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      await this.webhookService.triggerWebhook(WebhookEvent.IssueUpdated, issue);
      res.status(200).json(issue);
    } catch (error: any) {
      console.error('Error updating issue:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteIssue(req: Request, res: Response) {
    await param('id').isUUID().withMessage('Invalid issue ID').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await this.issueService.deleteIssue(req.params.id);
      res.status(204).send(); // No Content
    } catch (error: any) {
      console.error('Error deleting issue:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async listIssues(req: Request, res: Response) {
    try {
      const issues = await this.issueService.listIssues();
      res.status(200).json(issues);
    } catch (error: any) {
      console.error('Error listing issues:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}