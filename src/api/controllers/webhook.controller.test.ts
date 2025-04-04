// src/api/controllers/webhook.controller.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index'; // Adjust the path as needed
import { createDatabase, closeDatabase } from '../../src/db/database'; // Adjust the path as needed
import * as webhookService from '../services/webhook.service';
import { verifySignature } from '../../src/utils/signature';

// Mock the webhook service to control its behavior during tests.
vi.mock('../services/webhook.service');
vi.mock('../../src/utils/signature'); // Mock the signature verification

describe('WebhookController Integration Tests', () => {
  beforeAll(async () => {
    await createDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('POST /api/webhook should return 202 for a valid payload with no signature and no secret', async () => {
    // Arrange - Mock the service to simulate success
    vi.spyOn(webhookService, 'getWebhookById').mockResolvedValueOnce({ id: '123', secret: null });
    vi.spyOn(webhookService, 'enqueueWebhook').mockResolvedValueOnce(undefined);

    const payload = { event: 'issue_created', data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } } };
    const response = await request(app)
      .post('/api/webhook')
      .set('x-webhook-id', '123') // Assuming you'll pass the webhook ID in the header
      .send(payload)
      .set('Content-Type', 'application/json');

    // Assert
    expect(response.status).toBe(202);
    expect(response.body).toEqual({ message: 'Webhook received and enqueued.' });
    expect(webhookService.enqueueWebhook).toHaveBeenCalledWith(expect.objectContaining({
        event: 'issue_created',
        data: payload.data,
        webhookId: '123',
    }));
    expect(webhookService.getWebhookById).toHaveBeenCalledWith('123'); // Verify getWebhookById was called.
  });

  it('POST /api/webhook should return 400 if webhookId is missing', async () => {
    const response = await request(app)
        .post('/api/webhook')
        .send({ event: 'issue_created', data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } } })
        .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Webhook ID is required.' });
  });


  it('POST /api/webhook should return 404 if webhook is not found', async () => {
    // Arrange
    vi.spyOn(webhookService, 'getWebhookById').mockResolvedValueOnce(null); // Simulate webhook not found.

    const response = await request(app)
        .post('/api/webhook')
        .set('x-webhook-id', 'nonexistent-id')
        .send({ event: 'issue_created', data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } } })
        .set('Content-Type', 'application/json');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Webhook not found.' });
    expect(webhookService.getWebhookById).toHaveBeenCalledWith('nonexistent-id');
  });


  it('POST /api/webhook should return 202 for a valid payload with a valid signature and secret', async () => {
      // Arrange
      const webhookId = '123';
      const secret = 'testsecret';
      const payload = { event: 'issue_created', data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } } };
      const rawBody = JSON.stringify(payload);
      const signature = 'valid-signature'; // Replace with a valid signature based on your implementation.

      vi.spyOn(webhookService, 'getWebhookById').mockResolvedValueOnce({ id: webhookId, secret: secret });
      vi.spyOn(webhookService, 'enqueueWebhook').mockResolvedValueOnce(undefined);
      vi.spyOn(verifySignature, 'verifySignature').mockReturnValueOnce(true);  // Mock to return true

      const response = await request(app)
          .post('/api/webhook')
          .set('x-webhook-id', webhookId)
          .set('x-webhook-signature', signature)
          .send(payload)
          .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(202);
      expect(response.body).toEqual({ message: 'Webhook received and enqueued.' });
      expect(webhookService.enqueueWebhook).toHaveBeenCalledWith(expect.objectContaining({
          event: 'issue_created',
          data: payload.data,
          webhookId: webhookId,
      }));
      expect(webhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(verifySignature.verifySignature).toHaveBeenCalledWith(rawBody, signature, secret);
  });

  it('POST /api/webhook should return 401 for a valid payload with an invalid signature', async () => {
      // Arrange
      const webhookId = '123';
      const secret = 'testsecret';
      const payload = { event: 'issue_created', data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } } };
      const rawBody = JSON.stringify(payload);
      const signature = 'invalid-signature';

      vi.spyOn(webhookService, 'getWebhookById').mockResolvedValueOnce({ id: webhookId, secret: secret });
      vi.spyOn(verifySignature, 'verifySignature').mockReturnValueOnce(false); // Mock signature verification to fail.

      const response = await request(app)
          .post('/api/webhook')
          .set('x-webhook-id', webhookId)
          .set('x-webhook-signature', signature)
          .send(payload)
          .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid signature.' });
      expect(webhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(verifySignature.verifySignature).toHaveBeenCalledWith(rawBody, signature, secret);
      expect(webhookService.enqueueWebhook).not.toHaveBeenCalled(); // Ensure the webhook wasn't enqueued.
  });

  it('POST /api/webhook should return 401 if secret is set but signature is missing', async () => {
        // Arrange
        const webhookId = '123';
        const secret = 'testsecret';
        const payload = { event: 'issue_created', data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } } };

        vi.spyOn(webhookService, 'getWebhookById').mockResolvedValueOnce({ id: webhookId, secret: secret });

        const response = await request(app)
            .post('/api/webhook')
            .set('x-webhook-id', webhookId)
            .send(payload)
            .set('Content-Type', 'application/json');

        // Assert
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Missing signature.' });
        expect(webhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
        expect(webhookService.enqueueWebhook).not.toHaveBeenCalled();
  });


  it('POST /api/webhook should return 400 for an invalid JSON payload', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .set('x-webhook-id', '123')
      .send('this is not json') // Invalid JSON
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid request body.' });
  });
});