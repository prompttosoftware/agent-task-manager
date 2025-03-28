import request from 'supertest';
import app from '../../src/app'; // Assuming your Express app is exported from app.ts or similar
import { WebhookService } from '../../src/api/services/webhook.service';
import { WebhookRegisterRequest, WebhookDeleteResponse, WebhookListResponse, WebhookStatus } from '../../src/types/webhook.d';

// Mock the WebhookService
jest.mock('../../src/api/services/webhook.service');
const mockWebhookService = {
  registerWebhook: jest.fn(),
  deleteWebhook: jest.fn(),
  listWebhooks: jest.fn(),
};

// Set up the mock service to be used by the controller
const originalWebhookService = require('../../src/api/services/webhook.service');
originalWebhookService.WebhookService = jest.fn(() => mockWebhookService);

describe('WebhookController', () => {
  describe('POST /api/webhooks', () => {
    it('should register a webhook and return 201', async () => {
      const mockRequest: WebhookRegisterRequest = {
        callbackUrl: 'https://example.com/webhook',
        events: ['issue.created'],
      };
      const mockResponse = {
        id: 'webhook-id-123',
        callbackUrl: 'https://example.com/webhook',
        events: ['issue.created'],
        status: WebhookStatus.ACTIVE,
      };
      mockWebhookService.registerWebhook.mockResolvedValue(mockResponse);

      const response = await request(app).post('/api/webhooks').send(mockRequest);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResponse);
      expect(mockWebhookService.registerWebhook).toHaveBeenCalledWith(mockRequest);
    });

    it('should return 500 if registration fails', async () => {
      const mockRequest: WebhookRegisterRequest = {
        callbackUrl: 'https://example.com/webhook',
        events: ['issue.created'],
      };
      mockWebhookService.registerWebhook.mockRejectedValue(new Error('Registration failed'));

      const response = await request(app).post('/api/webhooks').send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Registration failed');
    });
  });

  describe('DELETE /api/webhooks/:webhookId', () => {
    it('should delete a webhook and return 200', async () => {
      const webhookId = 'webhook-id-123';
      const mockResponse: WebhookDeleteResponse = {
        id: webhookId,
        status: WebhookStatus.DELETED,
      };
      mockWebhookService.deleteWebhook.mockResolvedValue(mockResponse);

      const response = await request(app).delete(`/api/webhooks/${webhookId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
    });

    it('should return 500 if deletion fails', async () => {
      const webhookId = 'webhook-id-123';
      mockWebhookService.deleteWebhook.mockRejectedValue(new Error('Deletion failed'));

      const response = await request(app).delete(`/api/webhooks/${webhookId}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Deletion failed');
    });
  });

  describe('GET /api/webhooks', () => {
    it('should list webhooks and return 200', async () => {
      const mockResponse: WebhookListResponse = {
        webhooks: [
          {
            id: 'webhook-id-123',
            callbackUrl: 'https://example.com/webhook',
            events: ['issue.created'],
            status: WebhookStatus.ACTIVE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };
      mockWebhookService.listWebhooks.mockResolvedValue(mockResponse);

      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
    });

    it('should return 500 if listing fails', async () => {
      mockWebhookService.listWebhooks.mockRejectedValue(new Error('Listing failed'));

      const response = await request(app).get('/api/webhooks');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Listing failed');
    });
  });
});