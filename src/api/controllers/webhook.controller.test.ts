// src/api/controllers/webhook.controller.test.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { registerWebhook, deleteWebhook, listWebhooks } from './webhook.controller';
import * as webhookService from '../services/webhook.service';
import { RegisterWebhookRequest, Webhook } from '../../types/webhook';
import { validationResult } from 'express-validator';
import { logger } from '../../utils/logger';
import { validateRegisterWebhook } from '../validators/webhook.validator';

jest.mock('../services/webhook.service');
jest.mock('../utils/logger');
jest.mock('express-validator', () => ({
  validationResult: jest.fn().mockReturnValue({ isEmpty: jest.fn().mockReturnValue(true), array: jest.fn().mockReturnValue([]) }),
}));

describe('Webhook Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      sendStatus: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('registerWebhook', () => {
    it('should register a webhook successfully', async () => {
      const webhookData: RegisterWebhookRequest = {
        url: 'https://example.com/webhook',
        eventTypes: ['event1', 'event2'],
        isActive: true,
      };
      const newWebhook: Webhook = { ...webhookData, id: 'webhookId', createdAt: new Date(), updatedAt: new Date() };

      (webhookService.createWebhook as jest.Mock).mockResolvedValue(newWebhook);
      mockRequest.body = webhookData;

      await registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(webhookService.createWebhook).toHaveBeenCalledWith(webhookData);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith(newWebhook);
    });

    it('should return a validation error if there are validation errors', async () => {
      const validationErrors = [{ param: 'url', msg: 'Invalid URL' }];
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: jest.fn().mockReturnValue(false), array: jest.fn().mockReturnValue(validationErrors) });
      mockRequest.body = {};

      await registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({ errors: validationErrors });
      expect(logger.error).toHaveBeenCalledWith('Validation error: {"param":"url","msg":"Invalid URL"}');
    });

    it('should handle errors during webhook creation', async () => {
      const webhookData: RegisterWebhookRequest = {
        url: 'https://example.com/webhook',
        eventTypes: ['event1', 'event2'],
        isActive: true,
      };

      (webhookService.createWebhook as jest.Mock).mockRejectedValue(new Error('Failed to create webhook'));
      mockRequest.body = webhookData;

      await registerWebhook(mockRequest as Request, mockResponse as Response);

      expect(logger.error).toHaveBeenCalledWith('Error registering webhook: Failed to create webhook');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      const webhookId = 'webhookId';
      (webhookService.deleteWebhook as jest.Mock).mockResolvedValue(undefined);

      mockRequest.params = { webhookId };

      await deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(webhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
    });

    it('should handle errors when deleting a webhook', async () => {
      const webhookId = 'nonExistentWebhookId';
      (webhookService.deleteWebhook as jest.Mock).mockRejectedValue(new Error('Webhook not found'));

      mockRequest.params = { webhookId };

      await deleteWebhook(mockRequest as Request, mockResponse as Response);

      expect(logger.error).toHaveBeenCalledWith('Error deleting webhook: Webhook not found');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('listWebhooks', () => {
    it('should retrieve webhooks successfully', async () => {
      const webhooks: Webhook[] = [
        { id: 'webhookId1', url: 'https://example.com/webhook1', eventTypes: ['event1'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'webhookId2', url: 'https://example.com/webhook2', eventTypes: ['event2'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];
      (webhookService.getAllWebhooks as jest.Mock).mockResolvedValue(webhooks);

      await listWebhooks(mockRequest as Request, mockResponse as Response);

      expect(webhookService.getAllWebhooks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(webhooks);
    });

    it('should handle errors when retrieving webhooks', async () => {
      (webhookService.getAllWebhooks as jest.Mock).mockRejectedValue(new Error('Failed to retrieve webhooks'));

      await listWebhooks(mockRequest as Request, mockResponse as Response);

      expect(logger.error).toHaveBeenCalledWith('Error listing webhooks: Failed to retrieve webhooks');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
});