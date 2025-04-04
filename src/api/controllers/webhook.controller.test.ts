import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from '../services/webhook.service';
import { Request, Response } from 'express';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [WebhookService],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookService = module.get<WebhookService>(WebhookService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('should return 200 for a valid request', async () => {
      const mockRequest = {
        headers: {
          'x-hub-signature-256': 'sha256=valid_signature',
        },
        body: { some: 'data' },
      } as unknown as Request;
      const mockResponse = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;
      const mockWebhookServiceHandleWebhook = jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue(undefined);

      await controller.handleWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith();
      expect(mockWebhookServiceHandleWebhook).toHaveBeenCalledWith(mockRequest.body, 'sha256=valid_signature');
    });

    it('should return 400 if signature is missing', async () => {
      const mockRequest = {
        headers: {},
        body: { some: 'data' },
      } as unknown as Request;
      const mockResponse = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;

      await controller.handleWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Missing signature' });
    });

    it('should return 400 for an invalid signature', async () => {
      const mockRequest = {
        headers: {
          'x-hub-signature-256': 'sha256=invalid_signature',
        },
        body: { some: 'data' },
      } as unknown as Request;
      const mockResponse = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;
      const mockWebhookServiceHandleWebhook = jest.spyOn(webhookService, 'handleWebhook').mockRejectedValue(new Error('Invalid signature'));

      await controller.handleWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Invalid signature' });
      expect(mockWebhookServiceHandleWebhook).toHaveBeenCalledWith(mockRequest.body, 'sha256=invalid_signature');
    });

    it('should return 500 if handleWebhook throws an unexpected error', async () => {
      const mockRequest = {
        headers: {
          'x-hub-signature-256': 'sha256=valid_signature',
        },
        body: { some: 'data' },
      } as unknown as Request;
      const mockResponse = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;
      const mockWebhookServiceHandleWebhook = jest.spyOn(webhookService, 'handleWebhook').mockRejectedValue(new Error('Unexpected error'));

      await controller.handleWebhook(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(mockWebhookServiceHandleWebhook).toHaveBeenCalledWith(mockRequest.body, 'sha256=valid_signature');
    });
  });
});