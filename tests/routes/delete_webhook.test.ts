// tests/routes/delete_webhook.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Delete Webhook Route', () => {
  it('should return a 200 status code on successful deletion', async () => {
    const response = await request(app).delete('/api/webhooks/webhook-123');
    expect(response.statusCode).toBe(200);
  });

  it('should return a success message', async () => {
    const response = await request(app).delete('/api/webhooks/webhook-123');
    expect(response.body).toHaveProperty('message', 'Webhook deleted successfully');
  });
});