// tests/webhookRoutes.test.ts

import request from 'supertest';
import app from '../src/app'; // Assuming your app is exported from app.ts

// Mock the webhook service or any external dependencies
jest.mock('../src/services/webhookService', () => ({
  triggerWebhook: jest.fn(),
}));

const mockTriggerWebhook = require('../src/services/webhookService').triggerWebhook;

describe('Webhook Event Triggering', () => {

  // Test for issue creation event
  it('should trigger webhook on issue creation', async () => {
    const newIssueData = {
      summary: 'Test Issue',
      description: 'This is a test issue',
      // Add other required issue fields here as needed
    };

    const response = await request(app)
      .post('/api/issues') // Assuming your issue creation endpoint is at /api/issues
      .send(newIssueData)
      .expect(201); // Or the appropriate status code for issue creation

    // Expect triggerWebhook to have been called with the correct event and data
    expect(mockTriggerWebhook).toHaveBeenCalledWith(
      'issue.created',
      expect.objectContaining(newIssueData) // Adjust to match your issue data structure
    );
  });

  // Test for issue status change event
  it('should trigger webhook on issue status change', async () => {
    const issueKey = 'ATM-123'; // Replace with a valid issue key
    const transitionId = '21'; // Replace with a valid transition ID (e.g., In Progress)

    // Assuming you have an endpoint to transition issue status
    const response = await request(app)
      .put(`/api/issues/${issueKey}/transitions`) // Adjust your endpoint
      .send({ transitionId })
      .expect(200); // Or the appropriate status code for status change

    // Expect triggerWebhook to have been called with the correct event and data
    expect(mockTriggerWebhook).toHaveBeenCalledWith(
      'issue.status_changed',
      expect.objectContaining({ issueKey, transitionId }) // Adjust to match your event data
    );
  });
});
