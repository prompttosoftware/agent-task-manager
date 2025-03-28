import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import webhookRoutes from '../routes/webhook.routes';
import * as webhookService from '../services/webhook.service';
import { Webhook } from '../types/webhook.d';

vi.mock('../services/webhook.service');

const app = express();
app.use(express.json());
app.use('/webhooks', webhookRoutes);

describe('Webhook Controller', () => {
  const mockWebhook: Webhook = {
    id: '1',
    url: 'https://example.com/webhook',
    events: ['issue.created'],
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a webhook', async () => {
    (webhookService.createWebhook as jest.Mock).mockResolvedValue(1);

    const response = await request(app)
      .post('/webhooks')
      .send(mockWebhook);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1 });
    expect(webhookService.createWebhook).toHaveBeenCalledWith(mockWebhook);
  });

  it('should handle errors when registering a webhook', async () => {
    (webhookService.createWebhook as jest.Mock).mockRejectedValue(new Error('Service error'));

    const response = await request(app).post('/webhooks').send(mockWebhook);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Service error' });
  });

  it('should list webhooks', async () => {
    (webhookService.getAllWebhooks as jest.Mock).mockResolvedValue([mockWebhook]);

    const response = await request(app).get('/webhooks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockWebhook]);
    expect(webhookService.getAllWebhooks).toHaveBeenCalled();
  });

  it('should handle errors when listing webhooks', async () => {
    (webhookService.getAllWebhooks as jest.Mock).mockRejectedValue(new Error('Service error'));

    const response = await request(app).get('/webhooks');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Service error' });
  });

  it('should delete a webhook', async () => {
    (webhookService.deleteWebhook as jest.Mock).mockResolvedValue(1);

    const response = await request(app).delete('/webhooks/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Webhook deleted' });
    expect(webhookService.deleteWebhook).toHaveBeenCalledWith('1');
  });

  it('should handle errors when deleting a webhook', async () => {
    (webhookService.deleteWebhook as jest.Mock).mockRejectedValue(new Error('Service error'));

    const response = await request(app).delete('/webhooks/1');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Service error' });
  });
});