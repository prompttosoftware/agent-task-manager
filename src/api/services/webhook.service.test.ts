// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebhookService } from './webhook.service';
import { Webhook } from '../api/models/webhook';
import { Database } from '../../src/db/database';
import { Logger } from '../utils/logger';

// Mock the Database to isolate the service tests
vi.mock('../../src/db/database');
vi.mock('../utils/logger');

describe('WebhookService', () => {
    let webhookService: WebhookService;
    let mockDatabase: Database;
    let mockLogger: Logger;

    beforeEach(() => {
        // Create a mock for the Database
        mockDatabase = {
            run: vi.fn(),
            all: vi.fn(),
            get: vi.fn()
        } as any;
		mockLogger = {
			info: vi.fn(),
			error: vi.fn()
		} as any;

        // Clear mocks before each test
        vi.clearAllMocks();

        webhookService = new WebhookService(mockDatabase, mockLogger);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create a webhook successfully', async () => {
        const webhookData: Webhook = { url: 'https://example.com/webhook', events: ['event1', 'event2'], active: true, id: 'some-uuid' };

        (mockDatabase.run as any).mockResolvedValue({ changes: 1 }); // Mock the return value

        const result = await webhookService.createWebhook(webhookData);

        expect(result).toEqual(expect.objectContaining({url: webhookData.url, events: webhookData.events, active: webhookData.active}));
        expect(mockDatabase.run).toHaveBeenCalledWith(
            'INSERT INTO webhooks (id, url, events, active) VALUES (?, ?, ?, ?)',
            [expect.any(String), webhookData.url, JSON.stringify(webhookData.events), 1]
        );
        expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should not create webhook if invalid data', async () => {
        const webhookData: Webhook = { url: 'invalid-url', events: [], active: true, id: 'some-uuid' };
        try{
          await webhookService.createWebhook(webhookData);
        } catch(e: any){
          expect(e.message).toBe('Invalid webhook data');
          expect(mockLogger.error).toHaveBeenCalled();
        }
    });

    it('should list webhooks successfully', async () => {
        const mockWebhooks: Webhook[] = [
            { id: '1', url: 'https://example.com/webhook1', events: ['event1'], active: true },
            { id: '2', url: 'https://example.com/webhook2', events: ['event2'], active: false },
        ];
        (mockDatabase.all as any).mockResolvedValue(mockWebhooks.map(webhook => ({ ...webhook, events: JSON.stringify(webhook.events), active: webhook.active ? 1 : 0 }))); // Mock the return value

        const result = await webhookService.listWebhooks();

        expect(result).toEqual(mockWebhooks);
        expect(mockDatabase.all).toHaveBeenCalledWith('SELECT * FROM webhooks');
    });

    it('should get a webhook successfully', async () => {
        const id = 'some-uuid';
        const mockWebhook: Webhook = { id: 'some-uuid', url: 'https://example.com/webhook', events: ['event1'], active: true };
        (mockDatabase.get as any).mockResolvedValue({ ...mockWebhook, events: JSON.stringify(mockWebhook.events), active: mockWebhook.active ? 1 : 0 }); // Mock the return value

        const result = await webhookService.getWebhook(id);

        expect(result).toEqual(mockWebhook);
        expect(mockDatabase.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', id);
    });

    it('should update a webhook successfully with all properties', async () => {
        const id = 'some-uuid';
        const webhookData: Partial<Webhook> = { url: 'https://new-example.com/webhook', events: ['event3'], active: false };
        const existingWebhook: Webhook = { id: 'some-uuid', url: 'https://example.com/webhook', events: ['event1'], active: true };

        (mockDatabase.get as any).mockResolvedValue({ ...existingWebhook, events: JSON.stringify(existingWebhook.events), active: existingWebhook.active ? 1 : 0 });
        (mockDatabase.run as any).mockResolvedValue({ changes: 1 });

        const result = await webhookService.updateWebhook(id, webhookData);

        expect(result).toBe(true);
        expect(mockDatabase.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', id);
        expect(mockDatabase.run).toHaveBeenCalledWith(
            'UPDATE webhooks SET url = ?, events = ?, active = ? WHERE id = ?',
            [
                webhookData.url,
                JSON.stringify(webhookData.events),
                0,
                id
            ]
        );
    });

    it('should update a webhook successfully with only some properties', async () => {
        const id = 'some-uuid';
        const webhookData: Partial<Webhook> = { url: 'https://new-example.com/webhook' };
        const existingWebhook: Webhook = { id: 'some-uuid', url: 'https://example.com/webhook', events: ['event1'], active: true };

        (mockDatabase.get as any).mockResolvedValue({ ...existingWebhook, events: JSON.stringify(existingWebhook.events), active: existingWebhook.active ? 1 : 0 });
        (mockDatabase.run as any).mockResolvedValue({ changes: 1 });

        const result = await webhookService.updateWebhook(id, webhookData);

        expect(result).toBe(true);
        expect(mockDatabase.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', id);
        expect(mockDatabase.run).toHaveBeenCalledWith(
            'UPDATE webhooks SET url = ?, events = ?, active = ? WHERE id = ?',
            [
                webhookData.url,
                JSON.stringify(existingWebhook.events),
                1,
                id
            ]
        );
    });

    it('should return false if update fails because webhook not found', async () => {
        const id = 'some-uuid';
        (mockDatabase.get as any).mockResolvedValue(undefined);

        const result = await webhookService.updateWebhook(id, {url: 'test'});

        expect(result).toBe(false);
        expect(mockDatabase.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', id);
        expect(mockDatabase.run).not.toHaveBeenCalled();
    });

    it('should delete a webhook successfully', async () => {
        const id = 'some-uuid';
        (mockDatabase.run as any).mockResolvedValue({ changes: 1 });

        const result = await webhookService.deleteWebhook(id);

        expect(result).toBe(true);
        expect(mockDatabase.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', id);
    });

    it('should return false if delete fails because webhook not found', async () => {
        const id = 'some-uuid';
        (mockDatabase.run as any).mockResolvedValue({ changes: 0 });

        const result = await webhookService.deleteWebhook(id);

        expect(result).toBe(false);
        expect(mockDatabase.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', id);
    });
});