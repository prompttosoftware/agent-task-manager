// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { IssueService } from '../services/issue.service';
import { Issue } from '../types/issue.d';
import { validationResult } from 'express-validator';
import { WebhookService } from '../services/webhook.service';

/**
 * Controller for handling Issue-related requests.
 */
export class IssueController {
  private readonly issueService: IssueService;
  private readonly webhookService: WebhookService;

  /**
   * Constructs an IssueController.
   * @param issueService The service for Issue-related operations.
   * @param webhookService The service for webhook operations.
   */
  constructor(issueService: IssueService, webhookService: WebhookService) {
    this.issueService = issueService;
    this.webhookService = webhookService;
  }

  /**
   * Handles the request to get an issue by its ID.
   * @param req The Express request object.
   * @param res The Express response object.
   * @returns A JSON response with the issue data or an error message.
   */
  async getIssue(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const issue: Issue | undefined = await this.issueService.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.json(issue);
    } catch (error: any) {
      console.error('Error fetching issue:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  /**
   * Handles the request to update an existing issue.
   * @param req The Express request object.
   * @param res The Express response object.
   * @returns A JSON response with the updated issue data or an error message.
   */
  async updateIssue(req: Request, res: Response) {
    const { issueKey } = req.params;
    const updateData = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updatedIssue = await this.issueService.updateIssue(issueKey, updateData);
      if (!updatedIssue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      // Trigger webhook for issue updated event
      await this.webhookService.triggerWebhook('issue_updated', updatedIssue);

      res.json(updatedIssue);
    } catch (error: any) {
      console.error('Error updating issue:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
