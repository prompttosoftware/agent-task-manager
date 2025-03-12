// src/repositories/webhook.repository.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class WebhookRepository {
  // In-memory storage for webhooks (replace with database interaction)
  private webhooks: any[] = [
    // Example webhook data
    // {
    //   id: '1',
    //   url: 'https://example.com/webhook1',
    //   projectKey: 'ATM',
    //   issueType: 'Task',
    //   issueStatus: 'In Progress',
    //   event: 'issue_updated',
    // },
  ];

  async findWebhooksByEvent(event: string): Promise<any[]> {
    return this.webhooks.filter(webhook => webhook.event === event);
  }

  // Implement methods to create, update, and delete webhooks (for future admin features)
}
