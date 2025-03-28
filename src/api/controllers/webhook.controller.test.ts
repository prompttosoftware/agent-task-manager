// src/api/controllers/webhook.controller.test.ts
import { test, describe, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app'; // Import the app instance
import { WebhookService } from '../services/webhook.service';
import { validateWebhookRegister } from '../middleware/webhookValidation';
import { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import { validationResult } from 'express-validator';

vi.mock('../services/webhook.service');
vi.mock('../middleware/webhookValidation');

const mockWebhookService = mock<WebhookService>();

describe('Webhook Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(WebhookService).mockReturnValue(mockWebhookService);
    (validateWebhookRegister as jest.Mock).mockImplementation((req: Request, res: Response, next: () => void) => {
      next();
    });
  });

  describe('POST /api/webhooks', () => {
    it('should register a webhook successfully', async () => {
      const registerWebhookMock = vi.spyOn(mockWebhookService, 'registerWebhook').mockResolvedValue({ id: '123', url: 'https://example.com', events: [], secret: '', status: 'active' });
      const response = await request(app).post('/api/webhooks').send({ url: 'https://example.com', events: [], secret: 'secret' });

      expect(response.status).toBe(201);
      expect(registerWebhookMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com', events: [], secret: 'secret' }));
      expect(response.body).toEqual({ id: '123', url: 'https://example.com', events: [], secret: '', status: 'active' });
    });

    it('should handle invalid request (validation error)', async () => {
      (validationResult as any).mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'URL is required' }],
      }));

      const response = await request(app).post('/api/webhooks').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ errors: [{ msg: 'URL is required' }] });
    });

    it('should handle service errors', async () => {
      const registerWebhookMock = vi.spyOn(mockWebhookService, 'registerWebhook').mockRejectedValue(new Error('Database error'));
      const response = await request(app).post('/api/webhooks').send({ url: 'https://example.com', events: [], secret: 'secret' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to register webhook: Database error' });
    });
  });

  describe('DELETE /api/webhooks/:id', () => {
    it('should delete a webhook successfully', async () => {
      const deleteWebhookMock = vi.spyOn(mockWebhookService, 'deleteWebhook').mockResolvedValue({ message: 'Webhook deleted', webhookId: '123', success: true });
      const response = await request(app).delete('/api/webhooks/123');

      expect(response.status).toBe(200);
      expect(deleteWebhookMock).toHaveBeenCalledWith('123');
      expect(response.body).toEqual({ message: 'Webhook deleted', webhookId: '123', success: true });
    });

    it('should handle invalid webhookId format', async () => {
      const response = await request(app).delete('/api/webhooks/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Invalid webhookId format' });
    });

    it('should handle service errors when deleting', async () => {
      const deleteWebhookMock = vi.spyOn(mockWebhookService, 'deleteWebhook').mockRejectedValue(new Error('Database error'));
      const response = await request(app).delete('/api/webhooks/123');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to delete webhook: Database error' });
    });
  });

  describe('GET /api/webhooks', () => {
    it('should list webhooks successfully', async () => {
      const listWebhooksMock = vi.spyOn(mockWebhookService, 'listWebhooks').mockResolvedValue({ webhooks: [{ id: '123', url: 'https://example.com', events: [], secret: '', active: true }], total: 1 });
      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(200);
      expect(listWebhooksMock).toHaveBeenCalled();
      expect(response.body).toEqual({ webhooks: [{ id: '123', url: 'https://example.com', events: [], secret: '', active: true }], total: 1 });
    });

    it('should handle service errors when listing', async () => {
      const listWebhooksMock = vi.spyOn(mockWebhookService, 'listWebhooks').mockRejectedValue(new Error('Database error'));
      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to list webhooks: Database error' });
    });
  });

  describe('GET /api/webhooks/:id', () => {
    it('should get a webhook by id successfully', async () => {
      const getWebhookByIdMock = vi.spyOn(mockWebhookService, 'getWebhookById').mockResolvedValue({ id: '123', url: 'https://example.com', events: [], secret: '', active: true });
      const response = await request(app).get('/api/webhooks/123');

      expect(response.status).toBe(200);
      expect(getWebhookByIdMock).toHaveBeenCalledWith('123');
      expect(response.body).toEqual({ id: '123', url: 'https://example.com', events: [], secret: '', active: true });
    });

    it('should handle invalid webhookId format', async () => {
      const response = await request(app).get('/api/webhooks/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Invalid webhookId format' });
    });

    it('should handle service errors when getting by id', async () => {
      const getWebhookByIdMock = vi.spyOn(mockWebhookService, 'getWebhookById').mockRejectedValue(new Error('Database error'));
      const response = await request(app).get('/api/webhooks/123');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to get webhook by id: Database error' });
    });
  });
});