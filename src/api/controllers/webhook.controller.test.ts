// src/api/controllers/webhook.controller.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported
import * as webhookService from '../../src/services/webhook.service';
import { WebhookRegisterRequest, Webhook } from '../../src/types/webhook.d';

jest.mock('../../src/services/webhook.service');

describe('Webhook Controller', () => {
  describe('POST /webhooks/register', () => {
    it('should register a new webhook and return 201', async () => {
      const newWebhook: WebhookRegisterRequest = {
        callbackUrl: 'https://example.com/webhook',
        events: ['issue_created'],
      };
      const mockWebhook: Webhook = {
        id: '123',
        callbackUrl: newWebhook.callbackUrl,
        events: newWebhook.events,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      (webhookService.registerWebhook as jest.Mock).mockResolvedValue(mockWebhook);

      const response = await request(app)
        .post('/webhooks/register')
        .send(newWebhook)
        .set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(mockWebhook);
      expect(webhookService.registerWebhook).toHaveBeenCalledWith(newWebhook);
    });

    it('should return 400 if the request body is invalid', async () => {
      const response = await request(app)
        .post('/webhooks/register')
        .send({ invalid: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /webhooks/:id', () => {
    it('should delete a webhook and return 200', async () => {
      const webhookId = '123';
      (webhookService.deleteWebhook as jest.Mock).mockResolvedValue({ id: webhookId, status: 'deleted' });

      const response = await request(app).delete(`/webhooks/${webhookId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: webhookId, status: 'deleted' });
      expect(webhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
    });

    it('should return 404 if the webhook is not found', async () => {
      const webhookId = 'nonexistent';
      (webhookService.deleteWebhook as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete(`/webhooks/${webhookId}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /webhooks', () => {
    it('should list all webhooks and return 200', async () => {
      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          callbackUrl: 'https://example.com/webhook1',
          events: ['issue_created'],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          callbackUrl: 'https://example.com/webhook2',
          events: ['issue_updated'],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      (webhookService.listWebhooks as jest.Mock).mockResolvedValue({ webhooks: mockWebhooks });

      const response = await request(app).get('/webhooks');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ webhooks: mockWebhooks });
      expect(webhookService.listWebhooks).toHaveBeenCalled();
    });
  });
});
