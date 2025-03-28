// src/api/controllers/webhook.controller.test.ts
import { test, describe, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app'; // Import the app instance
import * as webhookService from '../services/webhook.service';

describe('Webhook Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/webhooks', () => {
    it('should register a webhook successfully', async () => {
      const mockCreateWebhook = vi.spyOn(webhookService, 'createWebhook').mockResolvedValue({ id: '123', url: 'https://example.com' });
      const response = await request(app).post('/api/webhooks').send({ url: 'https://example.com' });

      expect(response.status).toBe(201);
      expect(mockCreateWebhook).toHaveBeenCalledWith('https://example.com');
      expect(response.body).toEqual({ id: '123', url: 'https://example.com' });
    });

    it('should handle invalid request (missing URL)', async () => {
      const response = await request(app).post('/api/webhooks').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'URL is required' }); // Assuming you have validation
    });

    it('should handle service errors', async () => {
      vi.spyOn(webhookService, 'createWebhook').mockRejectedValue(new Error('Database error'));
      const response = await request(app).post('/api/webhooks').send({ url: 'https://example.com' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to register webhook' });
    });
  });

  describe('DELETE /api/webhooks/:id', () => {
    it('should delete a webhook successfully', async () => {
      const mockDeleteWebhook = vi.spyOn(webhookService, 'deleteWebhook').mockResolvedValue(true);
      const response = await request(app).delete('/api/webhooks/123');

      expect(response.status).toBe(204);
      expect(mockDeleteWebhook).toHaveBeenCalledWith('123');
    });

    it('should handle service errors when deleting', async () => {
      vi.spyOn(webhookService, 'deleteWebhook').mockRejectedValue(new Error('Database error'));
      const response = await request(app).delete('/api/webhooks/123');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to delete webhook' });
    });
  });

  describe('GET /api/webhooks', () => {
    it('should list webhooks successfully', async () => {
      const mockGetAllWebhooks = vi.spyOn(webhookService, 'getAllWebhooks').mockResolvedValue([{ id: '123', url: 'https://example.com' }]);
      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(200);
      expect(mockGetAllWebhooks).toHaveBeenCalled();
      expect(response.body).toEqual([{ id: '123', url: 'https://example.com' }]);
    });

    it('should handle service errors when listing', async () => {
      vi.spyOn(webhookService, 'getAllWebhooks').mockRejectedValue(new Error('Database error'));
      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to retrieve webhooks' });
    });
  });
});