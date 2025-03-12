// tests/issueDelete.test.ts
import request from 'supertest';
import app from '../src/app'; // Assuming your app instance is exported from app.ts
import { createIssue, deleteIssue, getIssue } from '../src/services/issueService'; // Assuming these functions exist
import { Issue } from '../src/models/issue';

// Mock webhook service (replace with actual implementation if needed)
jest.mock('../src/services/webhookService', () => ({
  sendWebhook: jest.fn(),
}));

import { sendWebhook } from '../src/services/webhookService';

describe('Webhook Trigger on Issue Deletion', () => {
  let createdIssue: Issue | undefined;

  afterEach(async () => {
    // Clean up the created issue after each test
    if (createdIssue && createdIssue.id) {
      await deleteIssue(createdIssue.id);
    }
    (sendWebhook as jest.Mock).mockClear();
  });

  it('should trigger a webhook when an issue is deleted', async () => {
    // 1. Create a new issue via the API
    const issueData = {
      summary: 'Test Issue for Deletion Webhook',
      description: 'This is a test issue to verify webhook trigger on deletion.',
    };

    try {
        const response = await createIssue(issueData);
        createdIssue = response;
    } catch (error) {
        console.error('Error creating issue:', error);
        throw error;
    }

    // 2. Delete the created issue via the API
    if (!createdIssue || !createdIssue.id) {
      throw new Error('Issue not created or missing ID for deletion.');
    }
    
    try {
        await deleteIssue(createdIssue.id);
    } catch (error) {
        console.error('Error deleting issue:', error);
        throw error;
    }

    // 3. Verify that a webhook is sent to the registered URL
    // 4. Check the payload of the webhook to ensure it contains the correct data for the deleted issue.
    expect(sendWebhook).toHaveBeenCalled();
    const webhookCall = (sendWebhook as jest.Mock).mock.calls[0];
    expect(webhookCall[0]).toEqual(expect.objectContaining({ // Check webhook payload.
        event: 'issue_deleted',
        issue: expect.objectContaining({ // Check issue details
            id: createdIssue?.id,
            summary: issueData.summary,
            description: issueData.description,
        }),
    }));

  });
});