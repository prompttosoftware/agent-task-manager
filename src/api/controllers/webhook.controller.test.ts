// src/api/controllers/webhook.controller.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerWebhook, deleteWebhook, listWebhooks, triggerWebhook } from './webhook.controller';
import { WebhookService } from '../services/webhook.service';
import { Webhook } from '../models/webhook';
import { validationResult, body } from 'express-validator';
import { WebhookEvent } from '../types/webhook';
import { addWebhookJob } from '../../src/services/webhookQueue';

// Mock express-validator
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
    body: vi.fn(() => ({
        isURL: vi.fn(() => ({ withMessage: vi.fn(() => ({ run: vi.fn() })) })),
        isArray: vi.fn(() => ({ withMessage: vi.fn(() => ({ run: vi.fn() })) })),
    })),
}));

vi.mock('../services/webhook.service');
vi.mock('../../src/services/webhookQueue');

const app = express();
app.use(express.json());

// Apply the controller functions to the express app
app.post('/webhooks', registerWebhook);
app.get('/webhooks', listWebhooks);
app.delete('/webhooks/:webhookId', deleteWebhook);

describe('WebhookController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createMockWebhookService = (methodMocks: Record<string, any> = {}) => {
        const mockService = {
            createWebhook: methodMocks.createWebhook || vi.fn(),
            listWebhooks: methodMocks.listWebhooks || vi.fn(),
            deleteWebhook: methodMocks.deleteWebhook || vi.fn(),
        } as any;
        vi.mocked(WebhookService).mockReturnValue(mockService);
        return mockService;
    };

    describe('POST /webhooks - Register Webhook', () => {
        it('should register a webhook successfully', async () => {
            const mockWebhook: Webhook = { id: '123', callbackUrl: 'https://example.com', events: ['issue.created'], secret: 'secret', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            const mockWebhookService = createMockWebhookService({ createWebhook: vi.fn().mockResolvedValue(mockWebhook) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).post('/webhooks').send({ callbackUrl: 'https://example.com', events: ['issue.created'], secret: 'secret' });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockWebhook);
            expect(mockWebhookService.createWebhook).toHaveBeenCalledWith({ callbackUrl: 'https://example.com', events: ['issue.created'], secret: 'secret' });
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 400 if validation fails', async () => {
            const mockErrors = [{ param: 'callbackUrl', msg: 'Invalid URL' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors } as any);
            const response = await request(app).post('/webhooks').send({ callbackUrl: 'not-a-url', events: [], secret: 'secret' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ errors: mockErrors });
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });

        it('should return 500 if registering webhook fails', async () => {
            const errorMessage = 'Failed to register webhook';
            const mockWebhookService = createMockWebhookService({ createWebhook: vi.fn().mockRejectedValue(new Error(errorMessage)) });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

            const response = await request(app).post('/webhooks').send({ callbackUrl: 'https://example.com', events: ['issue.created'], secret: 'secret' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: errorMessage });
            expect(mockWebhookService.createWebhook).toHaveBeenCalled();
            expect(vi.mocked(validationResult).mock.calls.length).toBe(1);
        });
    });

    describe('DELETE /webhooks/:webhookId - Delete Webhook', () => {
        it('should delete a webhook successfully', async () => {
            const mockWebhookService = createMockWebhookService({ deleteWebhook: vi.fn().mockResolvedValue(true) });

            const response = await request(app).delete('/webhooks/123');

            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
            expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith('123');
        });

        it('should return 500 if deleting webhook fails', async () => {
            const errorMessage = 'Failed to delete webhook';
            const mockWebhookService = createMockWebhookService({ deleteWebhook: vi.fn().mockRejectedValue(new Error(errorMessage)) });

            const response = await request(app).delete('/webhooks/123');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: errorMessage });
            expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith('123');
        });
    });

    describe('GET /webhooks - List Webhooks', () => {
        it('should list webhooks successfully', async () => {
            const mockWebhooks: Webhook[] = [{ id: '1', callbackUrl: 'https://example.com', events: ['issue.created'], secret: 'secret', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: '2', callbackUrl: 'https://example.com/2', events: ['issue.updated'], secret: 'secret', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
            const mockWebhookService = createMockWebhookService({ listWebhooks: vi.fn().mockResolvedValue(mockWebhooks) });

            const response = await request(app).get('/webhooks');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockWebhooks);
            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
        });

        it('should return 500 if listing webhooks fails', async () => {
            const errorMessage = 'Failed to list webhooks';
            const mockWebhookService = createMockWebhookService({ listWebhooks: vi.fn().mockRejectedValue(new Error(errorMessage)) });

            const response = await request(app).get('/webhooks');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: errorMessage });
            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
        });
    });

    describe('triggerWebhook', () => {
        it('should call addWebhookJob for matching events', async () => {
            const eventType = WebhookEvent.IssueCreated;
            const eventData = { issueId: '123' };
            const mockWebhooks: Webhook[] = [
                { id: '1', callbackUrl: 'https://example.com', events: ['issue.created'], secret: 'secret', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: '2', callbackUrl: 'https://example.com/2', events: ['issue.updated'], secret: 'secret', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ];
            const mockWebhookService = createMockWebhookService({ listWebhooks: vi.fn().mockResolvedValue(mockWebhooks) });

            await triggerWebhook(eventType, eventData);

            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
            expect(addWebhookJob).toHaveBeenCalledWith({
                url: 'https://example.com',
                event: eventType,
                data: eventData,
                secret: 'secret'
            });
            expect(addWebhookJob).not.toHaveBeenCalledWith( {
                url: 'https://example.com/2',
                event: eventType,
                data: eventData,
                secret: 'secret'
            });
        });

        it('should not call addWebhookJob if no webhooks match the event', async () => {
            const eventType = WebhookEvent.IssueDeleted;
            const eventData = { issueId: '123' };
            const mockWebhooks: Webhook[] = [
                { id: '1', callbackUrl: 'https://example.com', events: ['issue.created'], secret: 'secret', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ];
            const mockWebhookService = createMockWebhookService({ listWebhooks: vi.fn().mockResolvedValue(mockWebhooks) });

            await triggerWebhook(eventType, eventData);

            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
            expect(addWebhookJob).not.toHaveBeenCalled();
        });

        it('should handle errors when listing webhooks', async () => {
            const eventType = WebhookEvent.IssueCreated;
            const eventData = { issueId: '123' };
            const errorMessage = 'Failed to list webhooks';
            const mockWebhookService = createMockWebhookService({ listWebhooks: vi.fn().mockRejectedValue(new Error(errorMessage)) });

            await triggerWebhook(eventType, eventData);

            expect(mockWebhookService.listWebhooks).toHaveBeenCalled();
            expect(addWebhookJob).not.toHaveBeenCalled();
        });
    });
});