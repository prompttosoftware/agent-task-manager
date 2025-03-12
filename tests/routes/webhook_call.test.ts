// tests/routes/webhook_call.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Webhook Call Route', () => {
  it('should return a 200 status code on successful webhook call', async () => {
    const response = await request(app).post('/api/webhooks/call/webhook-123').send({ event: 'issue_created' });
    expect(response.statusCode).toBe(200);
  });

  it('should process the webhook event', async () => {
    const response = await request(app).post('/api/webhooks/call/webhook-123').send({ event: 'issue_created' });
    expect(response.body).toHaveProperty('message', 'Webhook event processed');
  });
});