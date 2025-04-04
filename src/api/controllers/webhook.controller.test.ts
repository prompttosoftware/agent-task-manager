// src/api/controllers/webhook.controller.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createWebhook, listWebhooks, getWebhook, updateWebhook, deleteWebhook } from './webhook.controller'; // Import the controller functions
import { WebhookService } from '../services/webhook.service';
import { Webhook } from '../models/webhook';
import { validationResult } from 'express-validator';

vi.mock('../services/webhook.service');
vi.mock('express-validator', () => ({
    validationResult: vi.fn()
}));

const app = express();
app.use(express.json());

// Mock the webhook service and the validation middleware to control their behavior during tests
const mockWebhookService = {
    createWebhook: vi.fn(),
    listWebhooks: vi.fn(),
    getWebhook: vi.fn(),
    updateWebhook: vi.fn(),
    deleteWebhook: vi.fn(),
};

// Apply the controller functions to the express app.
app.post('/webhooks', createWebhook);
app.get('/webhooks', listWebhooks);
app.get('/webhooks/:id', getWebhook);
app.put('/webhooks/:id', updateWebhook);
app.delete('/webhooks/:id', deleteWebhook);

describe('WebhookController', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore mocks after each test
        vi.restoreAllMocks();
    });

    describe('POST /webhooks', () => {
        it('should create a webhook successfully', async () => {
            const webhookData: Webhook = { url: 'https://example.com', events: ['event1'], active: true };
            const createdWebhook: any = { ...webhookData, id: '123' }; // Assuming createWebhook returns the created object with an ID
            vi.mocked(mockWebhookService.createWebhook).mockResolvedValue(createdWebhook);
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] }); // Mock successful validation

            // Override the WebhookService constructor to use the mock
            const originalWebhookService = new WebhookService({} as any);
            // @ts-ignore
            new WebhookService = mockWebhookService

            const response = await request(app)
                .post('/webhooks')
                .send(webhookData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(createdWebhook);
            expect(mockWebhookService.createWebhook).toHaveBeenCalledWith(webhookData);
        });

        it('should return 400 if validation fails', async () => {
            const webhookData: any = { url: 'not-a-url', events: ['event1'], active: true };
            const validationErrors = [{ msg: 'Invalid URL' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => validationErrors });

            const response = await request(app)
                .post('/webhooks')
                .send(webhookData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(validationErrors);
            expect(mockWebhookService.createWebhook).not.toHaveBeenCalled();
        });

        it('should return 500 if creating webhook fails', async () => {
            const webhookData: Webhook = { url: 'https://example.com', events: ['event1'], active: true };
            const errorMessage = 'Failed to create webhook';
            vi.mocked(mockWebhookService.createWebhook).mockRejectedValue(new Error(errorMessage));
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] }); // Mock successful validation

            const response = await request(app)
                .post('/webhooks')
                .send(webhookData);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to create webhook');
            expect(mockWebhookService.createWebhook).toHaveBeenCalledWith(webhookData);
        });
    });

    describe('GET /webhooks', () => {
        it('should list webhooks successfully', async () => {
            const mockWebhooks: Webhook[] = [{ id: '1', url: 'https://example.com', events: ['event1'], active: true }, { id: '2', url: 'https://example.com/2', events: ['event2'], active: false }];
            vi.mocked(mockWebhookService.listWebhooks).mockResolvedValue(mockWebhooks);

            const response = await request(app).get('/webhooks');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockWebhooks);
            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
        });

        it('should return 500 if listing webhooks fails', async () => {
            const errorMessage = 'Failed to retrieve webhooks';
            vi.mocked(mockWebhookService.listWebhooks).mockRejectedValue(new Error(errorMessage));

            const response = await request(app).get('/webhooks');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to retrieve webhooks');
            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
        });
    });

    describe('GET /webhooks/:id', () => {
        it('should get a webhook successfully', async () => {
            const webhookId = '123';
            const mockWebhook: Webhook = { id: '123', url: 'https://example.com', events: ['event1'], active: true };
            vi.mocked(mockWebhookService.getWebhook).mockResolvedValue(mockWebhook);

            const response = await request(app).get(`/webhooks/${webhookId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockWebhook);
            expect(mockWebhookService.getWebhook).toHaveBeenCalledWith(webhookId);
        });

        it('should return 404 if webhook is not found', async () => {
            const webhookId = '123';
            vi.mocked(mockWebhookService.getWebhook).mockResolvedValue(undefined);

            const response = await request(app).get(`/webhooks/${webhookId}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Webhook not found');
            expect(mockWebhookService.getWebhook).toHaveBeenCalledWith(webhookId);
        });

        it('should return 500 if getting webhook fails', async () => {
            const webhookId = '123';
            const errorMessage = 'Failed to retrieve webhook';
            vi.mocked(mockWebhookService.getWebhook).mockRejectedValue(new Error(errorMessage));

            const response = await request(app).get(`/webhooks/${webhookId}`);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to retrieve webhook');
            expect(mockWebhookService.getWebhook).toHaveBeenCalledWith(webhookId);
        });
    });

    describe('PUT /webhooks/:id', () => {
        it('should update a webhook successfully', async () => {
            const webhookId = '123';
            const webhookData: Webhook = { url: 'https://new-example.com', events: ['event2'], active: false };
            const updatedWebhook: any = { ...webhookData, id: webhookId };
            vi.mocked(mockWebhookService.updateWebhook).mockResolvedValue(true);
            vi.mocked(mockWebhookService.getWebhook).mockResolvedValue(updatedWebhook)
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] }); // Mock successful validation

            const response = await request(app)
                .put(`/webhooks/${webhookId}`)
                .send(webhookData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(updatedWebhook);
            expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith(webhookId, webhookData);
        });

        it('should return 400 if validation fails', async () => {
            const webhookId = '123';
            const webhookData: any = { url: 'not-a-url', events: ['event2'], active: false };
            const validationErrors = [{ msg: 'Invalid URL' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => validationErrors });

            const response = await request(app)
                .put(`/webhooks/${webhookId}`)
                .send(webhookData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(validationErrors);
            expect(mockWebhookService.updateWebhook).not.toHaveBeenCalled();
        });

        it('should return 404 if webhook is not found', async () => {
            const webhookId = '123';
            const webhookData: Webhook = { url: 'https://new-example.com', events: ['event2'], active: false };
            vi.mocked(mockWebhookService.updateWebhook).mockResolvedValue(false);
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] }); // Mock successful validation


            const response = await request(app)
                .put(`/webhooks/${webhookId}`)
                .send(webhookData);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Webhook not found');
            expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith(webhookId, webhookData);
        });

        it('should return 500 if updating webhook fails', async () => {
            const webhookId = '123';
            const webhookData: Webhook = { url: 'https://new-example.com', events: ['event2'], active: false };
            const errorMessage = 'Failed to update webhook';
            vi.mocked(mockWebhookService.updateWebhook).mockRejectedValue(new Error(errorMessage));
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] }); // Mock successful validation

            const response = await request(app)
                .put(`/webhooks/${webhookId}`)
                .send(webhookData);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to update webhook');
            expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith(webhookId, webhookData);
        });
    });

    describe('DELETE /webhooks/:id', () => {
        it('should delete a webhook successfully', async () => {
            const webhookId = '123';
            vi.mocked(mockWebhookService.deleteWebhook).mockResolvedValue(true);

            const response = await request(app).delete(`/webhooks/${webhookId}`);

            expect(response.status).toBe(204);
            expect(response.body).toEqual({}); // No content
            expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
        });

        it('should return 500 if deleting webhook fails', async () => {
            const webhookId = '123';
            const errorMessage = 'Failed to delete webhook';
            vi.mocked(mockWebhookService.deleteWebhook).mockRejectedValue(new Error(errorMessage));

            const response = await request(app).delete(`/webhooks/${webhookId}`);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to delete webhook');
            expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(webhookId);
        });
    });
});