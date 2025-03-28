import request from 'supertest';
import app from '../../src/app'; // Assuming your Express app is exported from app.ts or similar
import { WebhookService } from '../../src/api/services/webhook.service';
import { WebhookRegisterRequest, WebhookDeleteResponse, WebhookListResponse, WebhookStatus, Webhook } from '../../src/types/webhook.d';

// Mock the WebhookService
jest.mock('../../src/api/services/webhook.service');
const mockWebhookService = {
  registerWebhook: jest.fn(),
  deleteWebhook: jest.fn(),
  listWebhooks: jest.fn(),
  getWebhookById: jest.fn()
};

// Set up the mock service to be used by the controller
const originalWebhookService = require('../../src/api/services/webhook.service');
originalWebhookService.WebhookService = jest.fn(() => mockWebhookService);

describe('WebhookController', () => {
  describe('POST /api/webhooks', () => {
    it('should register a webhook and return 201', async () => {
      const mockRequest: WebhookRegisterRequest = {
        url: 'https://example.com/webhook',
        events: ['issue.created'],
        secret: 'mysecret'
      };
      const mockResponse = {
        id: 'webhook-id-123',
        url: 'https://example.com/webhook',
        events: ['issue.created'],
        secret: 'mysecret',
        status: WebhookStatus.ACTIVE,
      };
      mockWebhookService.registerWebhook.mockResolvedValue(mockResponse);

      const response = await request(app).post('/api/webhooks').send(mockRequest);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({id: 'webhook-id-123', url: 'https://example.com/webhook', events: ['issue.created'], secret: 'mysecret'}));
      expect(mockWebhookService.registerWebhook).toHaveBeenCalledWith(expect.objectContaining(mockRequest));
    });

    it('should return 400 if validation fails', async () => {
        const response = await request(app).post('/api/webhooks').send({events: ['issue.created']});
        expect(response.status).toBe(400);
    });

    it('should return 500 if registration fails', async () => {
      const mockRequest: WebhookRegisterRequest = {
        url: 'https://example.com/webhook',
        events: ['issue.created'],
        secret: 'mysecret'
      };
      mockWebhookService.registerWebhook.mockRejectedValue(new Error('Registration failed'));

      const response = await request(app).post('/api/webhooks').send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Registration failed');
    });
  });

  describe('DELETE /api/webhooks/:id', () => {
    it('should delete a webhook and return 200', async () => {
      const webhookId = 'webhook-id-123';
      const mockResponse: WebhookDeleteResponse = {
        message: 'Webhook deleted',
        webhookId: webhookId,
        success: true,
      };
      mockWebhookService.deleteWebhook.mockResolvedValue(mockResponse);

      const response = await request(app).delete(`/api/webhooks/${webhookId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
    });

      it('should return 400 if the id is invalid', async () => {
          const webhookId = 'invalid-id';
          const response = await request(app).delete(`/api/webhooks/${webhookId}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toBe('Invalid webhookId format');
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
            url: 'https://example.com/webhook',
            events: ['issue.created'],
            secret: 'mysecret',
            active: true,
          },
        ],
        total: 1,
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

    describe('GET /api/webhooks/:id', () => {
        it('should get a webhook by id and return 200', async () => {
            const webhookId = 'webhook-id-123';
            const mockResponse: Webhook = {
                id: webhookId,
                url: 'https://example.com/webhook',
                events: ['issue.created'],
                secret: 'mysecret',
                active: true,
            };
            mockWebhookService.getWebhookById.mockResolvedValue(mockResponse);

            const response = await request(app).get(`/api/webhooks/${webhookId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResponse);
            expect(mockWebhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
        });

        it('should return 400 if the id is invalid', async () => {
            const webhookId = 'invalid-id';
            const response = await request(app).get(`/api/webhooks/${webhookId}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid webhookId format');
        });

        it('should return 404 if the webhook is not found', async () => {
            const webhookId = 'webhook-id-123';
            mockWebhookService.getWebhookById.mockResolvedValue(undefined);

            const response = await request(app).get(`/api/webhooks/${webhookId}`);

            expect(response.status).toBe(404);
            expect(mockWebhookService.getWebhookById).toHaveBeenCalledWith(webhookId);
        });

        it('should return 500 if getting webhook by id fails', async () => {
            const webhookId = 'webhook-id-123';
            mockWebhookService.getWebhookById.mockRejectedValue(new Error('Get by ID failed'));

            const response = await request(app).get(`/api/webhooks/${webhookId}`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Get by ID failed');
        });
    });
});