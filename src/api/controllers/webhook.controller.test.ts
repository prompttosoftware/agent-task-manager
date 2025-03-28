// src/api/controllers/webhook.controller.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { WebhookController } from './webhook.controller';
import { WebhookService } from '../services/webhook.service';
import { WebhookRegisterRequest, Webhook } from '../types/webhook';
import { mock } from 'vitest-mock-extended';

vi.mock('../services/webhook.service');

describe('WebhookController', () => {
  let webhookController: WebhookController;
  let mockWebhookService: WebhookService;
  let mockRequest: any; // Use 'any' or define a more specific type for your request
  let mockResponse: any; // Use 'any' or define a more specific type for your response

  beforeEach(() => {
    mockWebhookService = mock<WebhookService>();
    webhookController = new WebhookController(mockWebhookService);
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('registerWebhook', () => {
    it('should register a webhook successfully', async () => {
      const request: WebhookRegisterRequest = {
        url: 'https://example.com/webhook',
        events: ['task.created', 'task.updated'],
        secret: 'mysecret',
      };
      mockRequest = { body: request };
      (mockWebhookService.registerWebhook as any).mockResolvedValue({ id: 'some-id', ...request });

      await webhookController.registerWebhook(mockRequest, mockResponse);

      expect(mockWebhookService.registerWebhook).toHaveBeenCalledWith(request);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ id: 'some-id', ...request });
    });

    it('should handle errors during registration', async () => {
      const request: WebhookRegisterRequest = {
        url: 'https://example.com/webhook',
        events: ['task.created', 'task.updated'],
        secret: 'mysecret',
      };
      mockRequest = { body: request };
      (mockWebhookService.registerWebhook as any).mockRejectedValue(new Error('Service error'));

      await webhookController.registerWebhook(mockRequest, mockResponse);

      expect(mockWebhookService.registerWebhook).toHaveBeenCalledWith(request);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Service error' });
    });

    it('should return 400 if validation fails', async () => {
      mockRequest = { body: { url: 'not a url' } };
      const mockValidateResult = {
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue([{
          msg: 'Invalid URL',
          param: 'url',
        }]),
      };
      vi.mocked(require('express-validator')).validationResult.mockReturnValue(mockValidateResult);

      await webhookController.registerWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid URL', param: 'url' }] });
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      const webhookId = 'valid-uuid';
      mockRequest = { params: { id: webhookId } };
      (mockWebhookService.deleteWebhook as any).mockResolvedValue({ success: true, webhookId: webhookId });

      await webhookController.deleteWebhook(mockRequest, mockResponse);

      expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, webhookId: webhookId });
    });

    it('should return 404 if webhook not found', async () => {
      const webhookId = 'valid-uuid';
      mockRequest = { params: { id: webhookId } };
      (mockWebhookService.deleteWebhook as any).mockResolvedValue({ success: false, webhookId: webhookId });

      await webhookController.deleteWebhook(mockRequest, mockResponse);

      expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, webhookId: webhookId });
    });

    it('should handle errors during deletion', async () => {
      const webhookId = 'valid-uuid';
      mockRequest = { params: { id: webhookId } };
      (mockWebhookService.deleteWebhook as any).mockRejectedValue(new Error('Service error'));

      await webhookController.deleteWebhook(mockRequest, mockResponse);

      expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Service error' });
    });

    it('should return 400 for invalid webhookId format', async () => {
        const webhookId = 'invalid-uuid';
        mockRequest = { params: { id: webhookId } };

        await webhookController.deleteWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid webhookId format' });
        expect(mockWebhookService.deleteWebhook).not.toHaveBeenCalled();
    });
  });

  describe('listWebhooks', () => {
    it('should list webhooks successfully', async () => {
      const mockWebhooks: Webhook[] = [
        {
          id: 'id1',
          url: 'url1',
          events: ['event1'],
          secret: 'secret1',
          active: true,
        },
      ];
      mockRequest = {};
      (mockWebhookService.listWebhooks as any).mockResolvedValue({ webhooks: mockWebhooks, total: 1 });

      await webhookController.listWebhooks(mockRequest, mockResponse);

      expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ webhooks: mockWebhooks, total: 1 });
    });

    it('should handle errors during listing', async () => {
      mockRequest = {};
      (mockWebhookService.listWebhooks as any).mockRejectedValue(new Error('Service error'));

      await webhookController.listWebhooks(mockRequest, mockResponse);

      expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Service error' });
    });
  });

  describe('getWebhookById', () => {
    it('should get a webhook by id successfully', async () => {
      const webhookId = 'valid-uuid';
      const mockWebhook: Webhook = {
        id: webhookId,
        url: 'url1',
        events: ['event1'],
        secret: 'secret1',
        active: true,
      };
      mockRequest = { params: { id: webhookId } };
      (mockWebhookService.getWebhookById as any).mockResolvedValue(mockWebhook);

      await webhookController.getWebhookById(mockRequest, mockResponse);

      expect(mockWebhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWebhook);
    });

    it('should return 404 if webhook not found', async () => {
      const webhookId = 'valid-uuid';
      mockRequest = { params: { id: webhookId } };
      (mockWebhookService.getWebhookById as any).mockResolvedValue(undefined);

      await webhookController.getWebhookById(mockRequest, mockResponse);

      expect(mockWebhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Webhook not found' });
    });

    it('should handle errors during retrieval', async () => {
      const webhookId = 'valid-uuid';
      mockRequest = { params: { id: webhookId } };
      (mockWebhookService.getWebhookById as any).mockRejectedValue(new Error('Service error'));

      await webhookController.getWebhookById(mockRequest, mockResponse);

      expect(mockWebhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Service error' });
    });

    it('should return 400 for invalid webhookId format', async () => {
        const webhookId = 'invalid-uuid';
        mockRequest = { params: { id: webhookId } };

        await webhookController.getWebhookById(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid webhookId format' });
        expect(mockWebhookService.getWebhookById).not.toHaveBeenCalled();
    });
  });
});