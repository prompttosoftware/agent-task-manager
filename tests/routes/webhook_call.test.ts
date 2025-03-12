// tests/routes/webhook_call.test.ts
import request from 'supertest';
import app from '../../src/app';
import { createWebhook, processWebhookEvent } from '../../src/routes/webhook_call'; // Assuming these functions exist

describe('Webhook Call Route', () => {
  it('should return a 200 status code on successful webhook call', async () => {
    // Mock the createWebhook function to avoid actual webhook creation
    const mockCreateWebhook = jest.fn().mockResolvedValue({ success: true });
    (createWebhook as jest.Mock) = mockCreateWebhook;

    const response = await request(app).post('/api/webhook/call').send({ /* Example webhook data */ });
    expect(response.statusCode).toBe(200);
    expect(mockCreateWebhook).toHaveBeenCalled(); // Verify createWebhook was called
  });

  it('should process webhook events correctly', async () => {
    // Mock the processWebhookEvent function
    const mockProcessWebhookEvent = jest.fn().mockResolvedValue({ success: true });
    (processWebhookEvent as jest.Mock) = mockProcessWebhookEvent;

    const response = await request(app).post('/api/webhook/call').send({ /* Example webhook data */ });
    expect(response.statusCode).toBe(200);
    expect(mockProcessWebhookEvent).toHaveBeenCalled(); // Verify processWebhookEvent was called
  });

  it('should handle errors during webhook processing', async () => {
    // Mock processWebhookEvent to simulate an error
    const mockProcessWebhookEvent = jest.fn().mockRejectedValue(new Error('Processing failed'));
    (processWebhookEvent as jest.Mock) = mockProcessWebhookEvent;

    const response = await request(app).post('/api/webhook/call').send({ /* Example webhook data */ });
    expect(response.statusCode).toBe(500); // Or whatever error code is appropriate
    expect(mockProcessWebhookEvent).toHaveBeenCalled();
  });
});
