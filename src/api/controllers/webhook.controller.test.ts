// src/api/controllers/webhook.controller.test.ts
import request from 'supertest';
import express, { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import webhookRouter from '../routes/webhook.routes';
import * as webhookService from '../services/webhook.service';
import { Webhook } from '../models/webhook.model';

// Mock the webhookService
jest.mock('../services/webhook.service');

const app: Express = express();

app.use(express.json());
app.use('/api/webhooks', webhookRouter);

describe('Webhook Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/webhooks', () => {
    it('should register a webhook successfully', async () => {
      const webhookData = { url: 'https://example.com', events: ['event1', 'event2'] };
      const expectedWebhook: Webhook = { id: '123', ...webhookData };
      (webhookService.registerWebhook as jest.Mock).mockResolvedValue(expectedWebhook);

      const response = await request(app).post('/api/webhooks').send(webhookData);

      expect(response.status).toBe(StatusCodes.CREATED);
      expect(response.body).toEqual(expectedWebhook);
      expect(webhookService.registerWebhook).toHaveBeenCalledWith(expect.objectContaining(webhookData));
    });

    it('should return a validation error if the URL is missing', async () => {
      const webhookData = { events: ['event1', 'event2'] };
      const response = await request(app).post('/api/webhooks').send(webhookData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('errors');
      expect(webhookService.registerWebhook).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/webhooks/:webhookId', () => {
    it('should delete a webhook successfully', async () => {
      (webhookService.deleteWebhook as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/webhooks/123');

      expect(response.status).toBe(StatusCodes.NO_CONTENT);
      expect(webhookService.deleteWebhook).toHaveBeenCalledWith('123');
    });

    it('should return 404 if the webhook is not found', async () => {
      (webhookService.deleteWebhook as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/webhooks/456');

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(webhookService.deleteWebhook).toHaveBeenCalledWith('456');
    });
  });

  describe('GET /api/webhooks', () => {
    it('should list webhooks successfully', async () => {
      const expectedWebhooks: Webhook[] = [
        { id: '1', url: 'https://example.com/webhook1', events: ['event1'] },
        { id: '2', url: 'https://example.com/webhook2', events: ['event2'] },
      ];
      (webhookService.listWebhooks as jest.Mock).mockResolvedValue(expectedWebhooks);

      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual(expectedWebhooks);
      expect(webhookService.listWebhooks).toHaveBeenCalled();
    });
  });
});
