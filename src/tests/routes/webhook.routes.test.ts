// src/tests/routes/webhook.routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index'; // Assuming you have an app instance
import { InMemoryStorage } from '../../data/inMemoryStorage';
import { DataService } from '../../services/dataService';
import { WebhookService } from '../../services/webhookService';

const dataService = new DataService(new InMemoryStorage());
const webhookService = new WebhookService(dataService);

describe('Webhook Routes Integration Tests', () => {
  beforeAll(async () => {
    // Seed in-memory data if needed
  });

  afterAll(async () => {
    // Clean up in-memory data if needed
    dataService.clear();
  });

  it('POST /api/webhooks should register a webhook', async () => {
    const webhookData = {
      url: 'https://example.com/webhook',
      events: ['issue_created'],
    };
    const res = await request(app).post('/api/webhooks').send(webhookData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    // Add more assertions based on the expected response
  });

  it('GET /api/webhooks should list registered webhooks', async () => {
    const res = await request(app).get('/api/webhooks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Add more assertions based on the expected response
  });

  it('DELETE /api/webhooks/:id should delete a webhook', async () => {
    // First, register a webhook
    const webhookData = {
      url: 'https://example.com/webhook-delete',
      events: ['issue_created'],
    };
    const registerRes = await request(app).post('/api/webhooks').send(webhookData);
    const webhookId = registerRes.body.id;

    const res = await request(app).delete(`/api/webhooks/${webhookId}`);
    expect(res.statusCode).toBe(204);

    // Verify that the webhook is actually deleted (optional)
    const getRes = await request(app).get('/api/webhooks');
    const webhookExists = getRes.body.some((webhook) => webhook.id === webhookId);
    expect(webhookExists).toBe(false);
  });
});