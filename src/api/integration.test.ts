// src/tests/integration/integration.test.ts
import * as request from 'supertest';
import { app } from '../index'; // Import the app from index.ts
import { WebhookService } from '../api/services/webhook.service';
import { Database } from '../db/database';

// Before any tests run, start the server.  This assumes you have a way to start the server in index.ts.

// Mock the database and webhook service to avoid actual database calls and external dependencies.
const mockDatabase = {
    run: jest.fn(),
    all: jest.fn(),
    get: jest.fn()
};

const mockWebhookService = {
    createWebhook: jest.fn(),
    listWebhooks: jest.fn(),
    getWebhook: jest.fn(),
    updateWebhook: jest.fn(),
    deleteWebhook: jest.fn()
};

jest.mock('../db/database', () => ({
    Database: jest.fn(() => mockDatabase)
}));

jest.mock('../api/services/webhook.service', () => ({
    WebhookService: jest.fn(() => mockWebhookService)
}));


describe('Integration Tests', () => {
  describe('Webhook Endpoints', () => {
    it('should create a webhook', async () => {
      mockWebhookService.createWebhook.mockResolvedValue({ id: 'some-id', url: 'http://example.com/webhook', events: ['issue_created'], active: true });
      const response = await request(app)
        .post('/webhooks')
        .send({ url: 'http://example.com/webhook', events: ['issue_created'], active: true })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.url).toBe('http://example.com/webhook');
      expect(mockWebhookService.createWebhook).toHaveBeenCalled();
    });

    it('should get all webhooks', async () => {
      mockWebhookService.listWebhooks.mockResolvedValue([{ id: 'some-id', url: 'http://example.com/webhook', events: ['issue_created'], active: true }]);
      const response = await request(app)
        .get('/webhooks')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body[0].url).toBe('http://example.com/webhook');
      expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
    });

    it('should update a webhook', async () => {
        const webhookId = 'some-id';
        mockWebhookService.getWebhook.mockResolvedValue({ id: webhookId, url: 'http://example.com/webhook', events: ['issue_created'], active: true });
        mockWebhookService.updateWebhook.mockResolvedValue(true);

        const response = await request(app)
            .put(`/webhooks/${webhookId}`)
            .send({ url: 'http://updated.com/webhook', events: ['issue_updated'], active: false })
            .expect(200);

        expect(response.body).toBeDefined();
        expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith(webhookId, { url: 'http://updated.com/webhook', events: ['issue_updated'], active: false });
    });

    it('should delete a webhook', async () => {
        const webhookId = 'some-id';
        mockWebhookService.deleteWebhook.mockResolvedValue(true);

        await request(app)
            .delete(`/webhooks/${webhookId}`)
            .expect(200);

        expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
    });
  });
});