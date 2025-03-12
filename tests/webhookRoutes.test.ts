// tests/webhookRoutes.test.ts

import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from app.ts
import { createIssue } from '../src/services/issueService'; // Import the createIssue function or the necessary module.
import { Issue } from '../src/models/issue'; // Assuming you have an Issue model


// Mock the webhook service to prevent actual webhook calls during testing
jest.mock('../src/services/webhookService', () => ({
    triggerWebhook: jest.fn().mockResolvedValue(true),
}));

// Get triggerWebhook mock
const { triggerWebhook } = require('../src/services/webhookService');

describe('Webhook Trigger on Issue Creation', () => {
    it('should trigger a webhook when a new issue is created', async () => {
        const issueData = {
            summary: 'Test Issue',
            description: 'This is a test issue for webhook testing',
            // Add other required fields for your issue model
            // For example:
            // projectKey: 'ATM',
            // issueType: 'Task'
        };

        // Create a new issue via the API (assuming you have an endpoint for this)
        const response = await request(app)
            .post('/api/issues') // Replace with your actual endpoint
            .send(issueData)
            .expect(201);

        const createdIssue: Issue = response.body; // Assuming the API returns the created issue

        // Verify that the webhook service was called
        expect(triggerWebhook).toHaveBeenCalled();

        // You can add more specific assertions here to check the webhook payload.
        // For example:
        // expect(triggerWebhook).toHaveBeenCalledWith(expect.objectContaining({
        //     issue: expect.objectContaining({summary: 'Test Issue'})
        // }));

    });
});
