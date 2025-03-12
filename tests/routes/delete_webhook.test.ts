// tests/routes/delete_webhook.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts
import { createWebhook, deleteWebhook } from '../../src/services/webhookService'; // Assuming you have webhook service

// Mock the webhookService to isolate the tests
jest.mock('../../src/services/webhookService');

describe('DELETE /webhooks/:id', () => {
  it('should delete a webhook successfully', async () => {
    const webhookId = 'some-webhook-id';
    (deleteWebhook as jest.Mock).mockResolvedValue(true);

    const res = await request(app).delete(`/webhooks/${webhookId}`);

    expect(res.statusCode).toEqual(200);
    expect(deleteWebhook).toHaveBeenCalledWith(webhookId);
  });

  it('should return 404 if webhook not found', async () => {
    const webhookId = 'non-existent-webhook-id';
    (deleteWebhook as jest.Mock).mockResolvedValue(false);

    const res = await request(app).delete(`/webhooks/${webhookId}`);

    expect(res.statusCode).toEqual(404);
    expect(deleteWebhook).toHaveBeenCalledWith(webhookId);
  });

  it('should handle errors during deletion and return 500', async () => {
    const webhookId = 'error-webhook-id';
    (deleteWebhook as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

    const res = await request(app).delete(`/webhooks/${webhookId}`);

    expect(res.statusCode).toEqual(500);
    expect(deleteWebhook).toHaveBeenCalledWith(webhookId);
  });

    // Add more tests for different scenarios and error handling
});