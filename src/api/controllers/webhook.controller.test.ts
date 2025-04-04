// src/api/controllers/webhook.controller.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import webhookRouter from '../api/routes/webhook.routes';
import { registerWebhook, listWebhooks } from '../api/controllers/webhook.controller';
import { WebhookService } from '../api/services/webhook.service';
import { WebhookRegistration, Webhook } from '../api/types/webhook.d';

vi.mock('../api/services/webhook.service');

const app = express();
app.use(express.json());
app.use(webhookRouter);

describe('WebhookController', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /webhooks', () => {
    it('should register a webhook successfully', async () => {
      const registration: WebhookRegistration = { event: 'issue.created', url: 'https://example.com/webhook' };
      const mockWebhook: Webhook = { id: 1, ...registration };
      vi.mocked(webhookService.registerWebhook).mockResolvedValue(mockWebhook);

      const response = await request(app).post('/webhooks').send(registration);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockWebhook);
      expect(webhookService.registerWebhook).toHaveBeenCalledWith(registration);
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app).post('/webhooks').send({ event: 'invalid', url: 'not-a-url' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle errors during registration', async () => {
      const registration: WebhookRegistration = { event: 'issue.created', url: 'https://example.com/webhook' };
      const errorMessage = 'Failed to register webhook';
      vi.mocked(webhookService.registerWebhook).mockRejectedValue(new Error(errorMessage));

      const response = await request(app).post('/webhooks').send(registration);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(errorMessage);
      expect(webhookService.registerWebhook).toHaveBeenCalledWith(registration);
    });
  });

  describe('GET /webhooks', () => {
    it('should list webhooks successfully', async () => {
      const mockWebhooks: Webhook[] = [
        { id: 1, event: 'issue.created', url: 'https://example.com/webhook1' },
        { id: 2, event: 'issue.updated', url: 'https://example.com/webhook2' },
      ];
      vi.mocked(webhookService.listWebhooks).mockResolvedValue(mockWebhooks);

      const response = await request(app).get('/webhooks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWebhooks);
      expect(webhookService.listWebhooks).toHaveBeenCalled();
    });

    it('should return 500 if listing webhooks fails', async () => {
      const errorMessage = 'Failed to retrieve webhooks';
      vi.mocked(webhookService.listWebhooks).mockRejectedValue(new Error(errorMessage));

      const response = await request(app).get('/webhooks');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(errorMessage);
      expect(webhookService.listWebhooks).toHaveBeenCalled();
    });
  });
});
