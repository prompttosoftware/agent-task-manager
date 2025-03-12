// src/services/issue.service.ts

import { Injectable } from '@nestjs/common';
import { IssueRepository } from '../repositories/issue.repository';
import { WebhookService } from './webhook.service';
import { Issue } from '../models/issue.model';

@Injectable()
export class IssueService {
  constructor(private readonly issueRepository: IssueRepository, private readonly webhookService: WebhookService) {}

  async createIssue(issueData: any): Promise<Issue> {
    const issue = await this.issueRepository.create(issueData);
    await this.webhookService.triggerWebhook('issue_created', issue);
    return issue;
  }

  async updateIssue(issueKey: string, updateData: any): Promise<Issue | undefined> {
    const existingIssue = await this.issueRepository.findByKey(issueKey);
    if (!existingIssue) {
      return undefined;
    }

    const previousStatus = existingIssue.status;

    const updatedIssue = await this.issueRepository.update(issueKey, updateData);
    if (updatedIssue && updatedIssue.status !== previousStatus) {
      await this.webhookService.triggerWebhook('issue_transitioned', updatedIssue, previousStatus);
    } else if (updatedIssue) {
        await this.webhookService.triggerWebhook('issue_updated', updatedIssue, previousStatus);
    }

    return updatedIssue;
  }

  async deleteIssue(issueKey: string): Promise<void> {
    const issue = await this.issueRepository.findByKey(issueKey);
    if(issue) {
        await this.issueRepository.delete(issueKey);
        await this.webhookService.triggerWebhook('issue_deleted', issue);
    }
  }

  getChangelog(issue: Issue, previousStatus: string) {
      if(issue.status !== previousStatus) {
          return {
            items: [
              {
                field: 'status',
                fieldtype: 'jira',
                from: previousStatus,
                fromString: previousStatus,
                to: issue.status,
                toString: issue.status
              }
            ]
          }
      }
      return null;
  }
}
