import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import webhookRoutes from '../routes/webhook.routes';
import * as webhookService from '../services/webhook.service';
import { WebhookRegisterRequest, Webhook } from '../types/webhook.d';

vi.mock('../services/webhook.service');

const app = express();
app.use(express.json());
app.use('/webhooks', webhookRoutes);

describe('Webhook Controller', () => {
  const mockWebhookRegisterRequest: WebhookRegisterRequest = {
    url: 'https://example.com/webhook',
    events: ['issue.created'],
    secret: 'testSecret',
  };

  const mockWebhook: Webhook = {
    id: 'uuid-1',
    url: mockWebhookRegisterRequest.url,
    events: mockWebhookRegisterRequest.events,
    secret: mockWebhookRegisterRequest.secret,
    active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a webhook with valid input', async () => {
    (webhookService.registerWebhook as jest.Mock).mockResolvedValue(mockWebhook);

    const response = await request(app)
      .post('/webhooks')
      .send(mockWebhookRegisterRequest);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({ id: mockWebhook.id, url: mockWebhook.url, events: mockWebhook.events, secret: mockWebhook.secret }));
    expect(webhookService.registerWebhook).toHaveBeenCalledWith(mockWebhookRegisterRequest);
  });

  it('should return 400 for invalid input when registering a webhook', async () => {
    const response = await request(app)
      .post('/webhooks')
      .send({ url: 'not-a-url', events: [''] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({ errors: expect.any(Array) }));
    expect(webhookService.registerWebhook).not.toHaveBeenCalled();
  });

  it('should handle errors when registering a webhook', async () => {
    (webhookService.registerWebhook as jest.Mock).mockRejectedValue(new Error('Service error'));

    const response = await request(app).post('/webhooks').send(mockWebhookRegisterRequest);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Service error' });
  });

  it('should list webhooks', async () => {
    (webhookService.listWebhooks as jest.Mock).mockResolvedValue({ webhooks: [mockWebhook], total: 1 });

    const response = await request(app).get('/webhooks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ webhooks: [expect.objectContaining({id: mockWebhook.id, url: mockWebhook.url, events: mockWebhook.events, secret: mockWebhook.secret, active: mockWebhook.active})], total: 1 });
    expect(webhookService.listWebhooks).toHaveBeenCalled();
  });

  it('should handle errors when listing webhooks', async () => {
    (webhookService.listWebhooks as jest.Mock).mockRejectedValue(new Error('Service error'));

    const response = await request(app).get('/webhooks');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Service error' });
  });

  it('should delete a webhook', async () => {
    (webhookService.deleteWebhook as jest.Mock).mockResolvedValue({ message: 'Webhook deleted', webhookId: mockWebhook.id, success: true });

    const response = await request(app).delete(`/webhooks/${mockWebhook.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Webhook deleted', webhookId: mockWebhook.id, success: true });
    expect(webhookService.deleteWebhook).toHaveBeenCalledWith(mockWebhook.id);
  });

  it('should handle errors when deleting a webhook', async () => {
    (webhookService.deleteWebhook as jest.Mock).mockRejectedValue(new Error('Service error'));

    const response = await request(app).delete(`/webhooks/${mockWebhook.id}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Service error' });
  });
});
