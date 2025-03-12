// tests/webhookRoutes.test.ts

import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported

describe('Webhook Registration Endpoint', () => {
  it('should register a webhook successfully', async () => {
    const res = await request(app)
      .post('/api/webhooks') // Assuming the endpoint is /api/webhooks
      .send({ // Example payload
        url: 'https://example.com/webhook',
        events: ['issue_created', 'issue_updated'],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Webhook registered');
    // Add more assertions as needed, e.g., checking the response body
  });

  it('should return an error if the payload is invalid', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({ // Invalid payload
        url: 'not a valid url',
        events: ['issue_created'],
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should handle server errors', async () => {
    // Mock the service to throw an error (example)
    // Assuming there's some service that handles webhook registration
    // You'd likely need to mock the service to simulate an error.
    // This is a placeholder and needs to be adapted based on the actual implementation
    // jest.mock('../src/services/webhookService', () => ({
    //   registerWebhook: jest.fn().mockRejectedValue(new Error('Simulated server error')),
    // }));

    const res = await request(app)
      .post('/api/webhooks')
      .send({ // Valid payload
        url: 'https://example.com/webhook',
        events: ['issue_created', 'issue_updated'],
      });

    expect(res.statusCode).toBeGreaterThanOrEqual(500);
    expect(res.body).toHaveProperty('error');
  });
});
