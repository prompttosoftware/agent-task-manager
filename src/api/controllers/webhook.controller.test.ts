import { Request, Response } from 'express';
import * as webhookController from './webhook.controller';
import * as webhookService from '../services/webhook.service';
import { WebhookRegisterRequest } from '../types/webhook.d';

// Mock the service methods
jest.mock('../services/webhook.service');
const mockedWebhookService = jest.mocked(webhookService);

describe('Webhook Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks(); // Clear mocks between tests
  });

  describe('registerWebhook', () => {
    it('should return 400 if callbackUrl is missing', async () => {
      mockRequest.body = { events: ['event1'] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'callbackUrl is required' });
    });

    it('should return 400 if callbackUrl is invalid format', async () => {
      mockRequest.body = { callbackUrl: 'invalid-url', events: ['event1'] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid callbackUrl format' });
    });

    it('should return 400 if callbackUrl does not use HTTPS', async () => {
      mockRequest.body = { callbackUrl: 'http://example.com', events: ['event1'] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'callbackUrl must use HTTPS' });
    });

    it('should return 400 if events is missing', async () => {
      mockRequest.body = { callbackUrl: 'https://example.com' } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'events is required and must be a non-empty array' });
    });

    it('should return 400 if events is not an array', async () => {
      mockRequest.body = { callbackUrl: 'https://example.com', events: 'not an array' } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'events is required and must be a non-empty array' });
    });

    it('should return 400 if events is an empty array', async () => {
      mockRequest.body = { callbackUrl: 'https://example.com', events: [] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'events is required and must be a non-empty array' });
    });

    it('should return 400 if any event is not a string', async () => {
      mockRequest.body = { callbackUrl: 'https://example.com', events: [123] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'events must be an array of non-empty strings' });
    });

    it('should return 400 if any event is an empty string', async () => {
      mockRequest.body = { callbackUrl: 'https://example.com', events: [''] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'events must be an array of non-empty strings' });
    });

    it('should return 400 if secret is not a string', async () => {
      mockRequest.body = { callbackUrl: 'https://example.com', events: ['event1'], secret: 123 } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'secret must be a string' });
    });

    it('should return 201 and the new webhook on success', async () => {
      const mockWebhook = { id: '123', callbackUrl: 'https://example.com', events: ['event1'], status: 'active' };
      mockedWebhookService.createWebhook.mockResolvedValue(mockWebhook);
      mockRequest.body = { callbackUrl: 'https://example.com', events: ['event1'] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWebhook);
      expect(mockedWebhookService.createWebhook).toHaveBeenCalledWith({ callbackUrl: 'https://example.com', events: ['event1'] });
    });

    it('should return 500 on service error', async () => {
      mockedWebhookService.createWebhook.mockRejectedValue(new Error('Service error'));
      mockRequest.body = { callbackUrl: 'https://example.com', events: ['event1'] } as WebhookRegisterRequest;
      await webhookController.registerWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Service error' });
    });
  });

  describe('deleteWebhook', () => {
    it('should return 400 if webhookId is missing', async () => {
      mockRequest.params = {};
      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'webhookId is required' });
    });

    it('should return 400 if webhookId is not a string', async () => {
      mockRequest.params = { webhookId: 123 };
      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'webhookId must be a string' });
    });

    it('should return 204 on successful deletion', async () => {
      mockRequest.params = { webhookId: '123' };
      mockedWebhookService.deleteWebhook.mockResolvedValue({ id: '123', status: 'deleted' });
      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockedWebhookService.deleteWebhook).toHaveBeenCalledWith('123');
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { webhookId: '123' };
      mockedWebhookService.deleteWebhook.mockRejectedValue(new Error('Service error'));
      await webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Service error' });
    });
  });

  describe('listWebhooks', () => {
    it('should return 200 and the webhooks on success', async () => {
      const mockWebhooks = [{ id: '1', callbackUrl: 'https://example.com', events: ['event1'], status: 'active' }];
      mockedWebhookService.getAllWebhooks.mockResolvedValue({ webhooks: mockWebhooks });
      await webhookController.listWebhooks(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ webhooks: mockWebhooks });
      expect(mockedWebhookService.getAllWebhooks).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      mockedWebhookService.getAllWebhooks.mockRejectedValue(new Error('Service error'));
      await webhookController.listWebhooks(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Service error' });
    });
  });
});