// tests/routes/issueDelete.test.ts

import request from 'supertest';
import app from '../../src/app';
import { createIssue, deleteIssue } from '../utils/issueHelper'; // Assuming you have helper functions
import { createWebhook, deleteWebhook } from '../utils/webhookHelper';


// Mock the webhookService to prevent actual webhook calls
jest.mock('../../src/services/webhookService', () => ({
    sendWebhook: jest.fn().mockResolvedValue(true),
}));

const mockSendWebhook = require('../../src/services/webhookService').sendWebhook;

describe('Issue Deletion Webhook Trigger', () => {
    let issueKey: string;
    let webhookUrl: string;
    let webhookId: string;

    beforeEach(async () => {
        // Create a webhook
        webhookUrl = 'http://example.com/webhook';
        const webhookResponse = await createWebhook(webhookUrl, 'issue.deleted');
        webhookId = webhookResponse.id;
    });

    afterEach(async () => {
        // Delete the issue if it was created
        if (issueKey) {
            await deleteIssue(issueKey);
        }

        // Delete the webhook
        if (webhookId) {
            await deleteWebhook(webhookId);
        }
        jest.clearAllMocks();
    });

    it('should trigger a webhook when an issue is deleted', async () => {
        // 1. Create a new issue
        const issueData = {
            fields: {
                summary: 'Test Issue for Webhook',
                issuetype: { name: 'Task' },
            },
        };

        const createdIssue = await createIssue(issueData);
        issueKey = createdIssue.key;

        // 2. Delete the created issue
        await deleteIssue(issueKey);

        // 3. Verify that a webhook was sent
        expect(mockSendWebhook).toHaveBeenCalled();
        expect(mockSendWebhook).toHaveBeenCalledWith(webhookUrl, expect.objectContaining({
            event: 'issue.deleted',
            issue: expect.objectContaining({ key: issueKey }), // Verify issue key in the payload
        }));

    });

    it('should not trigger a webhook if no webhook is registered', async () => {
         // 1. Create a new issue
         const issueData = {
            fields: {
                summary: 'Test Issue for Webhook',
                issuetype: { name: 'Task' },
            },
        };

        const createdIssue = await createIssue(issueData);
        issueKey = createdIssue.key;

        // 2. Delete the created issue
        await deleteIssue(issueKey);

         // 3. Verify that a webhook was sent
        expect(mockSendWebhook).not.toHaveBeenCalled();
    });
});
