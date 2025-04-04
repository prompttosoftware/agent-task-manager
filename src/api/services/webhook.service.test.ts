// tests/webhook.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebhookService } from '../src/api/services/webhook.service';
import { Database } from '../src/db/database';
import { Logger } from '../src/api/utils/logger';
import { Webhook } from '../src/api/models/webhook';

// Mock dependencies
vi.mock('../src/db/database');
vi.mock('../src/api/utils/logger');

describe('WebhookService', () => {
    let webhookService: WebhookService;
    let mockDatabase: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDatabase = {
            run: vi.fn(),
            all: vi.fn(),
            get: vi.fn(),
        };
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
        };
        webhookService = new WebhookService(mockDatabase, mockLogger);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const validWebhook: Webhook = {
        id: 'valid-id',
        url: 'https://example.com/webhook',
        events: ['event.created'],
        active: true,
    };

    const invalidWebhook: Webhook = {
        id: 'invalid-id',
        url: 'not-a-url',
        events: [],
        active: true,
    };


    describe('createWebhook', () => {
        it('should create a webhook successfully', async () => {
            mockDatabase.run.mockResolvedValue({ changes: 1 });
            const createdWebhook = await webhookService.createWebhook(validWebhook);
            expect(createdWebhook.url).toBe(validWebhook.url);
            expect(createdWebhook.events).toEqual(validWebhook.events);
            expect(mockDatabase.run).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should fail to create a webhook with invalid data', async () => {
            await expect(webhookService.createWebhook(invalidWebhook)).rejects.toThrow('Invalid webhook data');
            expect(mockDatabase.run).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            mockDatabase.run.mockRejectedValue(new Error('Database error'));
            await expect(webhookService.createWebhook(validWebhook)).rejects.toThrow('Database error');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('listWebhooks', () => {
        it('should list webhooks successfully', async () => {
            const mockWebhooks = [{ id: '1', url: 'url1', events: JSON.stringify(['event1']), active: 1 }];
            mockDatabase.all.mockResolvedValue(mockWebhooks);
            const webhooks = await webhookService.listWebhooks();
            expect(webhooks.length).toBe(1);
            expect(webhooks[0].events).toEqual(['event1']);
            expect(mockDatabase.all).toHaveBeenCalled();
        });

        it('should handle database errors when listing webhooks', async () => {
            mockDatabase.all.mockRejectedValue(new Error('Database error'));
            await expect(webhookService.listWebhooks()).rejects.toThrow('Database error');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('getWebhook', () => {
        it('should get a webhook by ID successfully', async () => {
            const mockWebhook = { id: '1', url: 'url1', events: JSON.stringify(['event1']), active: 1 };
            mockDatabase.get.mockResolvedValue(mockWebhook);
            const webhook = await webhookService.getWebhook('1');
            expect(webhook?.id).toBe('1');
            expect(webhook?.events).toEqual(['event1']);
            expect(mockDatabase.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', '1');
        });

        it('should return undefined if webhook is not found', async () => {
            mockDatabase.get.mockResolvedValue(undefined);
            const webhook = await webhookService.getWebhook('nonexistent-id');
            expect(webhook).toBeUndefined();
            expect(mockDatabase.get).toHaveBeenCalled();
        });

        it('should handle database errors when getting a webhook', async () => {
            mockDatabase.get.mockRejectedValue(new Error('Database error'));
            await expect(webhookService.getWebhook('1')).rejects.toThrow('Database error');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('updateWebhook', () => {
        it('should update a webhook successfully', async () => {
            const existingWebhook = { id: '1', url: 'old-url', events: ['event1'], active: true };
            mockDatabase.get.mockResolvedValue({ id: '1', url: 'old-url', events: JSON.stringify(['event1']), active: 1 });
            mockDatabase.run.mockResolvedValue({ changes: 1 });
            const updated = await webhookService.updateWebhook('1', { url: 'new-url' });
            expect(updated).toBe(true);
            expect(mockDatabase.run).toHaveBeenCalledWith('UPDATE webhooks SET url = ?, events = ?, active = ? WHERE id = ?', ['new-url', JSON.stringify(['event1']), 1, '1']);
            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should return false if webhook is not found', async () => {
            mockDatabase.get.mockResolvedValue(undefined);
            const updated = await webhookService.updateWebhook('nonexistent-id', { url: 'new-url' });
            expect(updated).toBe(false);
            expect(mockDatabase.run).not.toHaveBeenCalled();
        });

        it('should fail to update a webhook with invalid data', async () => {
            mockDatabase.get.mockResolvedValue({ id: '1', url: 'old-url', events: ['event1'], active: true });
            await expect(webhookService.updateWebhook('1', { url: 'not-a-url' })).rejects.toThrow('Invalid webhook data');
            expect(mockDatabase.run).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should handle database errors when updating a webhook', async () => {
            mockDatabase.get.mockResolvedValue({ id: '1', url: 'old-url', events: ['event1'], active: true });
            mockDatabase.run.mockRejectedValue(new Error('Database error'));
            const updated = await webhookService.updateWebhook('1', { url: 'new-url' });
            expect(updated).toBe(false);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('deleteWebhook', () => {
        it('should delete a webhook successfully', async () => {
            mockDatabase.run.mockResolvedValue({ changes: 1 });
            const deleted = await webhookService.deleteWebhook('1');
            expect(deleted).toBe(true);
            expect(mockDatabase.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', '1');
            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should return false if webhook is not found', async () => {
            mockDatabase.run.mockResolvedValue({ changes: 0 });
            const deleted = await webhookService.deleteWebhook('nonexistent-id');
            expect(deleted).toBe(false);
            expect(mockDatabase.run).toHaveBeenCalled();
        });

        it('should handle database errors when deleting a webhook', async () => {
            mockDatabase.run.mockRejectedValue(new Error('Database error'));
            const deleted = await webhookService.deleteWebhook('1');
            expect(deleted).toBe(false);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('isValidWebhook', () => {
        it('should validate a valid webhook', () => {
            const isValid = webhookService.isValidWebhook(validWebhook);
            expect(isValid).toBe(true);
        });

        it('should invalidate a webhook with an invalid URL', () => {
            const isValid = webhookService.isValidWebhook(invalidWebhook);
            expect(isValid).toBe(false);
        });

        it('should invalidate a webhook with empty events', () => {
            const webhook = { ...validWebhook, url: 'https://example.com', events: [] };
            const isValid = webhookService.isValidWebhook(webhook);
            expect(isValid).toBe(false);
        });
    });
});