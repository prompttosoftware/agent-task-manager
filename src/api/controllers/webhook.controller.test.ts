// src/api/controllers/webhook.controller.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createWebhook, listWebhooks, getWebhook, updateWebhook, deleteWebhook } from './webhook.controller';
import { WebhookService } from '../services/webhook.service';
import { Webhook } from '../models/webhook';
import { validationResult, body, param } from 'express-validator';

// Mock express-validator
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
    body: vi.fn(() => ({ isURL: vi.fn(() => ({ withMessage: vi.fn(() => ({ run: vi.fn() })) })) })),
    param: vi.fn(() => ({ isUUID: vi.fn(() => ({ withMessage: vi.fn(() => ({ run: vi.fn() })) })) })),
}));

vi.mock('../services/webhook.service');

const app = express();
app.use(express.json());

// Apply the controller functions to the express app.  Added routes for the other controller methods.
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

    // Helper function to create a mock WebhookService
    const createMockWebhookService = (methodMocks: Record<string, any> = {}) => {
        const mockService = {
            createWebhook: methodMocks.createWebhook || vi.fn(),
            listWebhooks: methodMocks.listWebhooks || vi.fn(),
            getWebhook: methodMocks.getWebhook || vi.fn(),
            updateWebhook: methodMocks.updateWebhook || vi.fn(),
            deleteWebhook: methodMocks.deleteWebhook || vi.fn(),
        } as any; // Explicitly type to avoid issues with partial mocks
        vi.mocked(WebhookService).mockReturnValue(mockService);
        return mockService;
    };


    describe('POST /webhooks', () => {
        it('should create a webhook successfully', async () => {
            const mockWebhook: Webhook = { id: '123', url: 'https://example.com', events: ['event1'], active: true };
            const mockWebhookService = createMockWebhookService({ createWebhook: vi.fn().mockResolvedValue(mockWebhook) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).post('/webhooks').send({ url: 'https://example.com', events: ['event1'] });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockWebhook);
            expect(mockWebhookService.createWebhook).toHaveBeenCalledWith({ url: 'https://example.com', events: ['event1'], active: undefined }); // active defaults to undefined, not false.
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 400 if validation fails', async () => {
            const mockErrors = [{ param: 'url', msg: 'Invalid URL' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors } as any);
            const response = await request(app).post('/webhooks').send({ url: 'not-a-url', events: [] });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(mockErrors);
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
            expect(validationResult).toHaveBeenCalledTimes(1);
        });

        it('should return 500 if creating webhook fails', async () => {
            const errorMessage = 'Failed to create webhook';
            const mockWebhookService = createMockWebhookService({ createWebhook: vi.fn().mockRejectedValue(new Error(errorMessage)) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).post('/webhooks').send({ url: 'https://example.com', events: ['event1'] });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe(errorMessage);
            expect(mockWebhookService.createWebhook).toHaveBeenCalled();
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });
    });

    describe('GET /webhooks', () => {
        it('should list webhooks successfully', async () => {
            const mockWebhooks: Webhook[] = [{ id: '1', url: 'https://example.com', events: ['event1'], active: true }, { id: '2', url: 'https://example.com/2', events: ['event2'], active: false }];
            const mockWebhookService = createMockWebhookService({ listWebhooks: vi.fn().mockResolvedValue(mockWebhooks) });

            const response = await request(app).get('/webhooks');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockWebhooks);
            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
        });

        it('should return 500 if listing webhooks fails', async () => {
            const errorMessage = 'Failed to retrieve webhooks';
            const mockWebhookService = createMockWebhookService({ listWebhooks: vi.fn().mockRejectedValue(new Error(errorMessage)) });

            const response = await request(app).get('/webhooks');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to retrieve webhooks');
            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
        });
    });


    describe('GET /webhooks/:id', () => {
        it('should get a webhook successfully', async () => {
            const mockWebhook: Webhook = { id: '123', url: 'https://example.com', events: ['event1'], active: true };
            const mockWebhookService = createMockWebhookService({ getWebhook: vi.fn().mockResolvedValue(mockWebhook) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).get('/webhooks/123');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockWebhook);
            expect(mockWebhookService.getWebhook).toHaveBeenCalledWith('123');
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 400 if validation fails', async () => {
            const mockErrors = [{ param: 'id', msg: 'Invalid ID' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors } as any);
            const response = await request(app).get('/webhooks/not-a-uuid');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(mockErrors);
            expect(mockWebhookService.getWebhook).not.toHaveBeenCalled();
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 404 if webhook is not found', async () => {
            const mockWebhookService = createMockWebhookService({ getWebhook: vi.fn().mockResolvedValue(undefined) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);
            const response = await request(app).get('/webhooks/123');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Webhook not found');
            expect(mockWebhookService.getWebhook).toHaveBeenCalledWith('123');
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 500 if getting webhook fails', async () => {
            const errorMessage = 'Failed to retrieve webhook';
            const mockWebhookService = createMockWebhookService({ getWebhook: vi.fn().mockRejectedValue(new Error(errorMessage)) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).get('/webhooks/123');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to retrieve webhook');
            expect(mockWebhookService.getWebhook).toHaveBeenCalledWith('123');
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });
    });

    describe('PUT /webhooks/:id', () => {
        it('should update a webhook successfully', async () => {
            const mockWebhook: Webhook = { id: '123', url: 'https://new-example.com', events: ['event2'], active: false };
            const mockWebhookService = createMockWebhookService({ updateWebhook: vi.fn().mockResolvedValue(true) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).put('/webhooks/123').send({ url: 'https://new-example.com', events: ['event2'], active: false });

            expect(response.status).toBe(200);
            //  Note:  We cannot test the exact return value, as the service does not return the updated object.
            //  expect(response.body).toEqual(mockWebhook); // This would fail, as there is no return value
            expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith('123', { url: 'https://new-example.com', events: ['event2'], active: false });
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 400 if validation fails', async () => {
            const mockErrors = [{ param: 'url', msg: 'Invalid URL' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors } as any);
            const response = await request(app).put('/webhooks/123').send({ url: 'not-a-url' });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(mockErrors);
            expect(mockWebhookService.updateWebhook).not.toHaveBeenCalled();
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 404 if webhook is not found', async () => {
            const mockWebhookService = createMockWebhookService({ updateWebhook: vi.fn().mockResolvedValue(false) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).put('/webhooks/123').send({ url: 'https://new-example.com' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Webhook not found');
            expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith('123', { url: 'https://new-example.com', events: undefined, active: undefined });
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 500 if updating webhook fails', async () => {
            const errorMessage = 'Failed to update webhook';
            const mockWebhookService = createMockWebhookService({ updateWebhook: vi.fn().mockRejectedValue(new Error(errorMessage)) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).put('/webhooks/123').send({ url: 'https://new-example.com' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to update webhook');
            expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith('123', { url: 'https://new-example.com', events: undefined, active: undefined });
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });
    });

    describe('DELETE /webhooks/:id', () => {
        it('should delete a webhook successfully', async () => {
            const mockWebhookService = createMockWebhookService({ deleteWebhook: vi.fn().mockResolvedValue(true) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).delete('/webhooks/123');

            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
            expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith('123');
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 400 if validation fails', async () => {
            const mockErrors = [{ param: 'id', msg: 'Invalid ID' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors } as any);

            const response = await request(app).delete('/webhooks/not-a-uuid');

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(mockErrors);
            expect(mockWebhookService.deleteWebhook).not.toHaveBeenCalled();
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 500 if deleting webhook fails', async () => {
            const errorMessage = 'Failed to delete webhook';
            const mockWebhookService = createMockWebhookService({ deleteWebhook: vi.fn().mockRejectedValue(new Error(errorMessage)) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).delete('/webhooks/123');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to delete webhook');
            expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith('123');
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });
    });
});