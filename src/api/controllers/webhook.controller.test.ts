// src/api/controllers/webhook.controller.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index'; // Adjust the path as needed
import { createDatabase, closeDatabase } from '../../src/db/database'; // Adjust the path as needed

describe('WebhookController Integration Tests', () => {
  beforeAll(async () => {
    await createDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('POST /api/webhook should return 200 for a valid issue_created payload', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ event: 'issue_created', data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } } })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it('POST /api/webhook should return 400 for an invalid payload', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ invalid: 'payload' })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
  });

  it('POST /api/webhook should return 200 for a valid issue_updated payload', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ event: 'issue_updated', data: { issue: { key: 'ATM-1', fields: { summary: 'Updated Test Issue' } } } })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it('POST /api/webhook should return 200 for a valid issue_deleted payload', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ event: 'issue_deleted', data: { issue: { key: 'ATM-1' } } })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it('POST /api/webhook should return 400 if event is missing', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ data: { issue: { key: 'ATM-1' } } })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
  });

  it('POST /api/webhook with invalid content type should return 415', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ event: 'issue_created', data: { issue: { key: 'ATM-1' } } })
      .set('Content-Type', 'text/plain');

    expect(response.status).toBe(415);
  });

  // Add more tests for different webhook events and error scenarios
});
