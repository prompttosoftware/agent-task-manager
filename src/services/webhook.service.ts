// src/services/webhook.service.ts

import { Injectable } from '@nestjs/common';
import { Issue } from '../models/issue.model';
import { WebhookRepository } from '../repositories/webhook.repository';
import { IssueService } from './issue.service';
import { Project } from '../models/project.model';

@Injectable()
export class WebhookService {
  constructor(private readonly webhookRepository: WebhookRepository, private readonly issueService: IssueService) {}

  async triggerWebhook(event: string, issue: Issue, previousIssueStatus?: string): Promise<void> {
    // 1. Fetch subscribed webhooks for the event
    const webhooks = await this.webhookRepository.findWebhooksByEvent(event);

    // 2. Filter webhooks based on projectKey, issueType, issueStatus, and previousIssueStatus
    const filteredWebhooks = this.filterWebhooks(webhooks, issue, previousIssueStatus, event);

    // 3. Construct and send webhook payloads asynchronously
    filteredWebhooks.forEach(async (webhook) => {
      try {
        const payload = this.constructPayload(event, issue, previousIssueStatus);
        await this.sendWebhook(webhook.url, payload);
        // Log success
        console.log(`Webhook triggered successfully for event ${event} and URL: ${webhook.url}`);
      } catch (error) {
        // Log failure
        console.error(`Webhook failed for event ${event} and URL: ${webhook.url}:`, error);
        // Implement retry mechanism here
      }
    });
  }

  private filterWebhooks(webhooks: any[], issue: Issue, previousIssueStatus?: string, event?: string): any[] {
    // Implement filtering logic here
    return webhooks.filter(webhook => {
      // Project Key filter
      if (webhook.projectKey && webhook.projectKey !== issue.projectKey) {
        return false;
      }

      // Issue Type filter
      if (webhook.issueType && webhook.issueType !== issue.issueType) {
        return false;
      }

      // Issue Status filter
      if (webhook.issueStatus && webhook.issueStatus !== issue.status) {
        return false;
      }
      
      // Previous Issue Status filter (only for transitions)
      if (previousIssueStatus && webhook.previousIssueStatus && webhook.previousIssueStatus !== previousIssueStatus) {
          return false;
      }

      return true;
    });
  }

  private constructPayload(event: string, issue: Issue, previousIssueStatus?: string): any {
    // Construct payload based on event type
    const payload: any = {
      webhookEvent: event,
      issue: {
        id: issue.id,  // Assuming issue has an id field
        key: issue.key, // Assuming issue has a key field
        fields: { ...issue },
      },
    };

    if (event === 'issue_updated' || event === 'issue_transitioned') {
        //Add changelog. Implement changelog logic in issueService
        if (previousIssueStatus !== undefined) {
          const changeLog = this.issueService.getChangelog(issue, previousIssueStatus);
          if(changeLog) {
            payload.changelog = changeLog;
          }
        }
    }

    return payload;
  }

  private async sendWebhook(url: string, payload: any): Promise<void> {
    // Implement HTTP POST request using node-fetch or built-in http/https modules
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Consider handling response (e.g., logging)
    } catch (error) {
      // Implement retry logic
      throw error;
    }
  }
}
