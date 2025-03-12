// tests/webhookRoutes.test.ts

import request from 'supertest';
import app from '../src/app';

describe('Webhook Routes', () => {
  it('GET /webhooks should return a list of webhooks', async () => {
    const response = await request(app).get('/webhooks');

    expect(response.status).toBe(200); // Assuming 200 OK on success
    // Add more assertions based on the expected response format
    expect(response.body).toEqual([]); // Expect an empty array initially, the implementation may change this
  });
});