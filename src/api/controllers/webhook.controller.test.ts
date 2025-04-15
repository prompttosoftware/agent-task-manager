// src/api/controllers/webhook.controller.test.ts
import request from 'supertest';
import express, { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import webhookRouter from '../routes/webhook.routes';
import * as webhookService from '../services/webhook.service';
import { Webhook } from '../types/webhook.d';
import { RegisterWebhookRequest } from '../../types/webhook';
import { validationResult } from 'express-validator';

// Mock the webhookService
jest.mock('../services/webhook.service');
jest.mock('express-validator');

const app: Express = express();

app.use(express.json());
app.use('/api/webhooks', webhookRouter);

// Mock validationResult
const mockValidationResult = jest.fn();
(validationResult as jest.Mock).mockImplementation(() => ({
  isEmpty: () => mockValidationResult.mock.calls.length === 0,
  array: () => mockValidationResult.mock.calls.length > 0 ? mockValidationResult.mock.calls.map(call => call[0]) : []
}));

describe('Webhook Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidationResult.mockClear();
  });

  describe('POST /api/webhooks', () => {
    it('should register a webhook successfully', async () => {
      const webhookData: RegisterWebhookRequest = { url: "https://example.com" };
      const expectedWebhook: Webhook = { id: '123', ...webhookData };
      (webhookService.createWebhook as jest.Mock).mockResolvedValue(expectedWebhook);
      mockValidationResult.mockReturnValueOnce([]); // No validation errors

      const response = await request(app).post('/api/webhooks').send(webhookData);

      expect(response.status).toBe(StatusCodes.CREATED);
      expect(response.body).toEqual(expectedWebhook);
      expect(webhookService.createWebhook).toHaveBeenCalledWith(webhookData);
      expect(validationResult).toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
        const webhookData = { url: 'invalid-url' }; // Invalid URL
        mockValidationResult.mockReturnValueOnce([{ msg: 'Invalid URL', param: 'url' }]);

        const response = await request(app).post('/api/webhooks').send(webhookData);

        expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        expect(response.body).toEqual({ errors: [{ msg: 'Invalid URL', param: 'url' }] });
        expect(webhookService.createWebhook).not.toHaveBeenCalled();
        expect(validationResult).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      const webhookData: RegisterWebhookRequest = { url: 'https://example.com' };
      (webhookService.createWebhook as jest.Mock).mockRejectedValue(new Error('Service error'));
      mockValidationResult.mockReturnValueOnce([]); // No validation errors

      const response = await request(app).post('/api/webhooks').send(webhookData);

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toBe('Internal Server Error');
      expect(webhookService.createWebhook).toHaveBeenCalledWith(webhookData);
      expect(validationResult).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/webhooks/:webhookId', () => {
    it('should delete a webhook successfully', async () => {
      (webhookService.deleteWebhook as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/webhooks/123');

      expect(response.status).toBe(StatusCodes.NO_CONTENT);
      expect(webhookService.deleteWebhook).toHaveBeenCalledWith('123');
    });

    it('should return 500 on service error', async () => {
      (webhookService.deleteWebhook as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app).delete('/api/webhooks/123');

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toBe('Internal Server Error');
      expect(webhookService.deleteWebhook).toHaveBeenCalledWith('123');
    });
  });

  describe('GET /api/webhooks', () => {
    it('should list webhooks successfully', async () => {
      const expectedWebhooks: Webhook[] = [
        { id: '1', url: 'https://example.com/webhook1' },
        { id: '2', url: 'https://example.com/webhook2' },
      ];
      (webhookService.getAllWebhooks as jest.Mock).mockResolvedValue(expectedWebhooks);

      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual(expectedWebhooks);
      expect(webhookService.getAllWebhooks).toHaveBeenCalledWith();
    });

    it('should return 500 on service error', async () => {
      (webhookService.getAllWebhooks as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toBe('Internal Server Error');
      expect(webhookService.getAllWebhooks).toHaveBeenCalledWith();
    });

     it('should return an empty array if no webhooks are found', async () => {
            (webhookService.getAllWebhooks as jest.Mock).mockResolvedValue([]);

            const response = await request(app).get('/api/webhooks');

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body).toEqual([]);
            expect(webhookService.getAllWebhooks).toHaveBeenCalled();
        });
  });
});
