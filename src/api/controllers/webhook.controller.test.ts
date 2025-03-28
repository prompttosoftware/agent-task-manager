// src/api/controllers/webhook.controller.test.ts
import { Request, Response } from 'express';
import { WebhookController } from './webhook.controller';
import { WebhookService } from '../services/webhook.service';
import { validationResult } from 'express-validator';
import { WebhookPayload } from '../types/webhook';

// Mock the express-validator module
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

// Mock the WebhookService
jest.mock('../services/webhook.service');

describe('WebhookController', () => {
  let webhookController: WebhookController;
  let webhookService: jest.Mocked<WebhookService>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Initialize the mock objects
    webhookService = new WebhookService(null) as jest.Mocked<WebhookService>;
    webhookController = new WebhookController(webhookService);
    mockRequest = {
      body: {}, // Default empty body
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('registerWebhook', () => {
    it('should return 400 if validation fails', async () => {
      // Mock validationResult to return errors
      (validationResult as jest.Mock).mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [ { msg: 'Validation error' } ],
      }));

      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ errors: [ { msg: 'Validation error' } ] });
    });

    it('should return 201 and the webhook if registration is successful', async () => {
      // Mock validationResult to return no errors
      (validationResult as jest.Mock).mockImplementation(() => ({
        isEmpty: () => true,
        array: () => [],
      }));
      const mockWebhook = {
        id: 'some-uuid',
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
        status: 'active',
      };
      webhookService.registerWebhook.mockResolvedValue(mockWebhook);

      mockRequest.body = {
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
      };

      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(webhookService.registerWebhook).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWebhook);
    });

    it('should return 500 if registration fails', async () => {
      // Mock validationResult to return no errors
      (validationResult as jest.Mock).mockImplementation(() => ({
        isEmpty: () => true,
        array: () => [],
      }));

      const errorMessage = 'Failed to register webhook';
      webhookService.registerWebhook.mockRejectedValue(new Error(errorMessage));

      mockRequest.body = {
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
      };

      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(webhookService.registerWebhook).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('deleteWebhook', () => {
    it('should return 400 for invalid webhookId format', async () => {
      mockRequest.params.id = 'invalid-id';
      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid webhookId format' });
    });

    it('should return 200 if deletion is successful', async () => {
      const webhookId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockRequest.params.id = webhookId;
      webhookService.deleteWebhook.mockResolvedValue({ message: 'Webhook deleted', webhookId: webhookId, success: true });

      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(webhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Webhook deleted', webhookId: webhookId, success: true });
    });

    it('should return 404 if webhook is not found', async () => {
      const webhookId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockRequest.params.id = webhookId;
      webhookService.deleteWebhook.mockResolvedValue({ message: 'Webhook not found', webhookId: webhookId, success: false });

      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(webhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Webhook not found', webhookId: webhookId, success: false });
    });

    it('should return 500 if deletion fails', async () => {
      const webhookId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockRequest.params.id = webhookId;
      const errorMessage = 'Failed to delete webhook';
      webhookService.deleteWebhook.mockRejectedValue(new Error(errorMessage));

      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(webhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('listWebhooks', () => {
    it('should return 200 and the list of webhooks', async () => {
      const mockWebhooks = [
        {
          id: 'some-uuid',
          url: 'https://example.com',
          events: ['event1'],
          secret: 'secret',
          active: true,
        },
      ];
      webhookService.listWebhooks.mockResolvedValue({ webhooks: mockWebhooks, total: 1 });

      await webhookController.listWebhooks(mockRequest as Request, mockResponse as Response);

      expect(webhookService.listWebhooks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ webhooks: mockWebhooks, total: 1 });
    });

    it('should return 500 if listing webhooks fails', async () => {
      const errorMessage = 'Failed to list webhooks';
      webhookService.listWebhooks.mockRejectedValue(new Error(errorMessage));

      await webhookController.listWebhooks(mockRequest as Request, mockResponse as Response);

      expect(webhookService.listWebhooks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('getWebhookById', () => {
    it('should return 400 for invalid webhookId format', async () => {
      mockRequest.params.id = 'invalid-id';
      await webhookController.getWebhookById(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid webhookId format' });
    });

    it('should return 200 and the webhook if found', async () => {
      const webhookId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockRequest.params.id = webhookId;
      const mockWebhook = {
        id: webhookId,
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
        active: true,
      };
      webhookService.getWebhookById.mockResolvedValue(mockWebhook);

      await webhookController.getWebhookById(mockRequest as Request, mockResponse as Response);

      expect(webhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWebhook);
    });

    it('should return 404 if webhook is not found', async () => {
      const webhookId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockRequest.params.id = webhookId;
      webhookService.getWebhookById.mockResolvedValue(undefined);

      await webhookController.getWebhookById(mockRequest as Request, mockResponse as Response);

      expect(webhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Webhook not found' });
    });

    it('should return 500 if getting webhook fails', async () => {
      const webhookId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockRequest.params.id = webhookId;
      const errorMessage = 'Failed to get webhook';
      webhookService.getWebhookById.mockRejectedValue(new Error(errorMessage));

      await webhookController.getWebhookById(mockRequest as Request, mockResponse as Response);

      expect(webhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('processWebhookEvent', () => {
    it('should return 200 if event is processed successfully', async () => {
      const mockPayload: WebhookPayload = {
        event: 'task.created',
        data: { taskId: '123', description: 'New Task' },
      };
      webhookService.processWebhookEvent.mockResolvedValue();
      mockRequest.body = mockPayload;

      await webhookController.processWebhookEvent(mockRequest as Request, mockResponse as Response);

      expect(webhookService.processWebhookEvent).toHaveBeenCalledWith(mockPayload);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Webhook event processed successfully' });
    });

    it('should return 500 if event processing fails', async () => {
      const mockPayload: WebhookPayload = {
        event: 'task.created',
        data: { taskId: '123', description: 'New Task' },
      };
      const errorMessage = 'Failed to process event';
      webhookService.processWebhookEvent.mockRejectedValue(new Error(errorMessage));
      mockRequest.body = mockPayload;

      await webhookController.processWebhookEvent(mockRequest as Request, mockResponse as Response);

      expect(webhookService.processWebhookEvent).toHaveBeenCalledWith(mockPayload);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});