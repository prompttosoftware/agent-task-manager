import { WebhookPayload } from '../types/webhook.d';
import * as zod from 'zod';
import { IssueService } from './issue.service';

const issueCreatedSchema = zod.object({
  issue: zod.object({
    key: zod.string(),
    fields: zod.object({
      summary: zod.string(),
      description: zod.string().optional(),
    }),
  }),
});

const issueUpdatedSchema = zod.object({
  issue: zod.object({
    key: zod.string(),
    fields: zod.object({
      summary: zod.string().optional(),
      description: zod.string().optional(),
    }),
  }),
});

export class WebhookService {
  private readonly issueService: IssueService;

  constructor(issueService: IssueService) {
    this.issueService = issueService;
  }

  public async handleEvent(payload: WebhookPayload): Promise<void> {
    if (!payload || !payload.event || !payload.data) {
      console.error('Invalid webhook payload.');
      return;
    }

    try {
      switch (payload.event) {
        case 'issue_created':
          await this.processIssueCreated(payload);
          break;
        case 'issue_updated':
          await this.processIssueUpdated(payload);
          break;
        default:
          console.warn(`Unhandled event type: ${payload.event}`);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }

  private async processIssueCreated(payload: WebhookPayload): Promise<void> {
    try {
      const parsedPayload = issueCreatedSchema.parse(payload.data);
      await this.issueService.createIssue(parsedPayload.issue);
    } catch (error) {
      console.error('Error processing issue_created:', error);
    }
  }

  private async processIssueUpdated(payload: WebhookPayload): Promise<void> {
    try {
      const parsedPayload = issueUpdatedSchema.parse(payload.data);
      await this.issueService.updateIssue(parsedPayload.issue.key, parsedPayload.issue);
    } catch (error) {
      console.error('Error processing issue_updated:', error);
    }
  }
}
