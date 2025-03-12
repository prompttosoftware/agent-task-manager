// tests/services/webhookService.test.ts
import { createIssue } from '../../src/api/issue'; // Assuming this is the correct import path
import { WebhookService } from '../../src/services/webhookService'; // Assuming this is the correct import path

// Mock the WebhookService or relevant functions
jest.mock('../../src/services/webhookService');

describe('Webhook Trigger on Issue Creation', () => {
  it('should trigger a webhook when a new issue is created', async () => {
    // Arrange
    const issueData = {
      summary: 'Test Issue',
      description: 'This is a test issue',
      // Add other required fields here
    };

    // Mock the webhook service's send function
    const mockSendWebhook = jest.fn();
    // @ts-ignore - ignoring typescript error since we mocked the module.
    WebhookService.sendWebhook = mockSendWebhook;

    // Act
    await createIssue(issueData);

    // Assert
    expect(mockSendWebhook).toHaveBeenCalled();
    // You might also want to verify the payload sent to the webhook, e.g.,
    // expect(mockSendWebhook).toHaveBeenCalledWith(expect.objectContaining({
    //   issue: expect.objectContaining(issueData),
    // }));
  });
});