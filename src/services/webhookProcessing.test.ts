// src/services/webhookProcessing.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import * as webhookProcessing from './webhookProcessing';
import { WebhookPayload } from '../api/types/webhook.d';
import webhookQueue from './webhookQueue';
import * as  webhookService from './webhook.service';

// Mock dependencies
vi.mock('ioredis');
vi.mock('./webhookQueue', () => ({
    default: {
        add: vi.fn(),
        process: vi.fn(),
    },
}));
vi.mock('./webhook.service', () => ({
    sendWebhook: vi.fn(),
}));


describe('webhookProcessing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock Redis and Bull
        (Redis as any).mockImplementation(() => ({})); // Minimal mock as it's mostly used by BullMQ internally
    });

    it('should enqueue a webhook job with correct parameters', async () => {
        const url = 'https://example.com/webhook';
        const data = { message: 'test' };
        const webhookId = 'webhook-123';
        const event = 'issue.created';

        await webhookProcessing.addWebhookJob(url, data, webhookId, event);

        expect(webhookQueue.add).toHaveBeenCalledWith('webhookJob', {
            url,
            data,
            webhookId,
            event,
        });
    });

    it('should handle errors when adding a webhook job to the queue', async () => {
        const url = 'https://example.com/webhook';
        const data = { message: 'test' };
        const webhookId = 'webhook-123';
        const event = 'issue.created';
        const errorMessage = 'Failed to add to queue';

        // Mock the add method to throw an error
        (webhookQueue.add as any).mockRejectedValue(new Error(errorMessage));

        await expect(webhookProcessing.addWebhookJob(url, data, webhookId, event)).rejects.toThrow(errorMessage);

        expect(webhookQueue.add).toHaveBeenCalledWith('webhookJob', {
            url,
            data,
            webhookId,
            event,
        });
    });

    it('should process a webhook job successfully (happy path)', async () => {
        const mockUrl = 'http://example.com/webhook';
        const mockData = { test: 'data' };
        const mockWebhookId = 'webhook-123';
        const mockEvent = 'issue.created';
        const mockPayload: WebhookPayload = {
            url: mockUrl,
            data: mockData,
            webhookId: mockWebhookId,
            event: mockEvent,
        };
        const mockSendWebhook = vi.spyOn(webhookService, 'sendWebhook').mockResolvedValue(undefined);


        const processFunction = (webhookQueue.process as any).mockImplementation((_, callback) => {
            callback({ data: mockPayload });
            return Promise.resolve();
        });


        const mockJob = { data: mockPayload } as any;
        await webhookProcessing.processWebhookJob(mockJob);

        expect(mockSendWebhook).toHaveBeenCalledWith(mockUrl, JSON.stringify(mockData), expect.any(Object));
        mockSendWebhook.mockRestore();
    });


    it('should handle errors when processing a webhook job', async () => {
        const mockUrl = 'http://example.com/webhook';
        const mockData = { test: 'data' };
        const mockWebhookId = 'webhook-123';
        const mockEvent = 'issue.created';
        const mockPayload: WebhookPayload = {
            url: mockUrl,
            data: mockData,
            webhookId: mockWebhookId,
            event: mockEvent,
        };
        const errorMessage = 'Failed to send webhook';
        const mockSendWebhook = vi.spyOn(webhookService, 'sendWebhook').mockRejectedValue(new Error(errorMessage));


        const processFunction = (webhookQueue.process as any).mockImplementation((_, callback) => {
            callback({ data: mockPayload });
            return Promise.resolve();
        });
        const mockJob = { data: mockPayload } as any;

        await expect(webhookProcessing.processWebhookJob(mockJob)).rejects.toThrow(errorMessage);
        expect(mockSendWebhook).toHaveBeenCalledWith(mockUrl, JSON.stringify(mockData), expect.any(Object));
        mockSendWebhook.mockRestore();
    });

    it('should retry a failed webhook job', async () => {
        const mockUrl = 'http://example.com/webhook';
        const mockData = { test: 'data' };
        const mockWebhookId = 'webhook-123';
        const mockEvent = 'issue.created';
        const mockPayload: WebhookPayload = {
            url: mockUrl,
            data: mockData,
            webhookId: mockWebhookId,
            event: mockEvent,
        };

        const errorMessage = 'Failed to send webhook';
        const mockSendWebhook = vi.spyOn(webhookService, 'sendWebhook').mockRejectedValue(new Error(errorMessage));

        const processFunction = (webhookQueue.process as any).mockImplementation((_, callback) => {
            callback({ data: mockPayload });
            return Promise.resolve();
        });
        const mockJob = {
            data: mockPayload,
            attemptsMade: 0,
            moveToFailed: vi.fn().mockResolvedValue(undefined),
        } as any;


        try {
            await webhookProcessing.processWebhookJob(mockJob);
        } catch (error: any) {
            // Expected error is thrown
            expect(error.message).toBe(errorMessage);
            expect(mockJob.moveToFailed).toHaveBeenCalled();
        }
        mockSendWebhook.mockRestore();
    });

    //  Add tests for retry mechanism if it exists
    it('should handle maximum retries reached', async () => {
        const mockUrl = 'http://example.com/webhook';
        const mockData = { test: 'data' };
        const mockWebhookId = 'webhook-123';
        const mockEvent = 'issue.created';
        const mockPayload: WebhookPayload = {
            url: mockUrl,
            data: mockData,
            webhookId: mockWebhookId,
            event: mockEvent,
        };
        const errorMessage = 'Failed to send webhook';
        const mockSendWebhook = vi.spyOn(webhookService, 'sendWebhook').mockRejectedValue(new Error(errorMessage));

        const processFunction = (webhookQueue.process as any).mockImplementation((_, callback) => {
            callback({ data: mockPayload });
            return Promise.resolve();
        });

        const mockJob = {
            data: mockPayload,
            attemptsMade: 3, // Simulate maximum retries reached
            moveToFailed: vi.fn().mockResolvedValue(undefined),
        } as any;
        await expect(webhookProcessing.processWebhookJob(mockJob)).rejects.toThrow(errorMessage);
        expect(mockJob.moveToFailed).toHaveBeenCalled();
        mockSendWebhook.mockRestore();
    });
});