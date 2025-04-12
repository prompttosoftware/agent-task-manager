import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from '../services/webhook.service';
import { Request, Response } from 'express';
import { vitest } from 'vitest';
import '@testing-library/jest-dom/extend-expect';

// Mock the WebhookService
jest.mock('../services/webhook.service');

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

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle webhook with valid signature and payload', async () => {
    const mockRequest = {
      headers: {
        'x-hub-signature-256': 'sha256=valid_signature',
      },
      body: { name: 'test_name' },
    } as unknown as Request;
    const mockResponse = { status: vitest.fn().mockReturnThis(), send: vitest.fn() } as unknown as Response;
    const mockHandleWebhookResult = { status: 200 };
    const mockHandleWebhook = jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue(mockHandleWebhookResult);

    await controller.handleWebhook(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith();
    expect(mockHandleWebhook).toHaveBeenCalledWith(mockRequest.body, 'sha256=valid_signature');
  });

  it('should return 400 if the signature is missing', async () => {
    const mockRequest = {
      headers: {},
      body: { name: 'test_name' },
    } as unknown as Request;
    const mockResponse = { status: vitest.fn().mockReturnThis(), send: vitest.fn() } as unknown as Response;
    const mockHandleWebhookResult = { status: 400, message: 'Missing signature' };
    const mockHandleWebhook = jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue(mockHandleWebhookResult);

    await controller.handleWebhook(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Missing signature' });
    expect(mockHandleWebhook).toHaveBeenCalledWith(mockRequest.body, undefined);
  });

  it('should return 400 if the payload is missing the name property', async () => {
    const mockRequest = {
      headers: {
        'x-hub-signature-256': 'sha256=valid_signature',
      },
      body: {  }, // Missing name
    } as unknown as Request;
    const mockResponse = { status: vitest.fn().mockReturnThis(), send: vitest.fn() } as unknown as Response;
    const mockHandleWebhookResult = { status: 400, message: 'Invalid payload: missing name property' };
    const mockHandleWebhook = jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue(mockHandleWebhookResult);

    await controller.handleWebhook(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Invalid payload: missing name property' });
    expect(mockHandleWebhook).toHaveBeenCalledWith(mockRequest.body, 'sha256=valid_signature');
  });
});