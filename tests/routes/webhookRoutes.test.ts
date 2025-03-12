// tests/routes/webhookRoutes.test.ts
import request from 'supertest';
import app from '../../src/app';
import * as webhookService from '../../src/services/webhookService';

describe('Webhook Listing Endpoint - Error Handling', () => {
  it('should return 500 status and error message on internal server error', async () => {
    // Mock the webhookService to throw an error
    jest.spyOn(webhookService, 'listWebhooks').mockRejectedValue(new Error('Simulated internal server error'));

    const response = await request(app).get('/api/webhooks');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Simulated internal server error');
    // You might want to check for other error details depending on your application's error handling

    // Restore the mock
    (webhookService.listWebhooks as jest.Mock).mockRestore();
  });
});