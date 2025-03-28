// src/api/controllers/webhook.controller.test.ts
import { test, expect, describe, beforeEach, vi } from 'vitest';
import { registerWebhook, deleteWebhook, listWebhooks } from './webhook.controller';
import * as webhookService from '../services/webhook.service';
import { Request, Response } from 'express';

describe('Webhook Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockWebhook = { id: '123', url: 'https://example.com' };

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('registerWebhook', () => {
    it('should register a webhook and return 201', async () => {
      mockRequest.body = { url: 'https://example.com' };
      vi.spyOn(webhookService, 'createWebhook').mockResolvedValue(mockWebhook);

      await registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWebhook);
      expect(webhookService.createWebhook).toHaveBeenCalledWith('https://example.com');
    });

    it('should return 400 if url is missing', async () => {
      mockRequest.body = {};

      await registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'URL is required' });
    });

    it('should return 500 on service error', async () => {
      mockRequest.body = { url: 'https://example.com' };
      vi.spyOn(webhookService, 'createWebhook').mockRejectedValue(new Error('Database error'));

      await registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to register webhook' });
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook and return 200', async () => {
      mockRequest.params = { id: '123' };
      vi.spyOn(webhookService, 'deleteWebhook').mockResolvedValue(true);

      await deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Webhook deleted successfully' });
      expect(webhookService.deleteWebhook).toHaveBeenCalledWith('123');
    });

    it('should return 400 if id is missing', async () => {
      mockRequest.params = {};

      await deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID is required' });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { id: '123' };
      vi.spyOn(webhookService, 'deleteWebhook').mockRejectedValue(new Error('Database error'));

      await deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to delete webhook' });
    });
  });

  describe('listWebhooks', () => {
    it('should list webhooks and return 200', async () => {
      vi.spyOn(webhookService, 'getAllWebhooks').mockResolvedValue([mockWebhook]);

      await listWebhooks(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([mockWebhook]);
      expect(webhookService.getAllWebhooks).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      vi.spyOn(webhookService, 'getAllWebhooks').mockRejectedValue(new Error('Database error'));

      await listWebhooks(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to retrieve webhooks' });
    });
  });
});
