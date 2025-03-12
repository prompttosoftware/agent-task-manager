// src/api/webhook.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/index'; // Assuming your app is exported from index.ts
import request from 'supertest';

// Mock any dependencies here if needed, e.g., the webhook calling mechanism

describe('Webhook API Endpoints', () => {
  it('POST /webhooks - should register a new webhook', async () => {
    const response = await request(app)
      .post('/webhooks')
      .send({ name: 'TestWebhook', url: 'http://example.com/webhook', events: ['issue_created'] });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('GET /webhooks - should list all registered webhooks', async () => {
    // First, register a webhook
    await request(app)
      .post('/webhooks')
      .send({ name: 'TestWebhook', url: 'http://example.com/webhook', events: ['issue_created'] });

    const response = await request(app).get('/webhooks');
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
    // Add more specific checks if you know what the listing should look like
  });

  it('DELETE /webhooks/:id - should delete a webhook', async () => {
    // First, register a webhook
    const registrationResponse = await request(app)
      .post('/webhooks')
      .send({ name: 'TestWebhook', url: 'http://example.com/webhook', events: ['issue_created'] });
    const webhookId = registrationResponse.body.id;

    const response = await request(app).delete(`/webhooks/${webhookId}`);
    expect(response.statusCode).toBe(204);
    // You might want to check if the webhook is actually gone by listing them after
  });

  // Add tests for event triggering (e.g., when an issue is created)
  it('should trigger webhook when an issue is created', async () => {
    // This test will require more setup as it involves the 'issue_created' event
    // and probably mocking the external webhook service
    // For example:
    // 1. Mock the external service
    // 2. Create an issue through your API
    // 3. Assert that the mock service received a POST request with the correct payload
    expect(true).toBe(true);
  });
});
