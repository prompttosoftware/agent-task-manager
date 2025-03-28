// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWebhook, getWebhook, listWebhooks, deleteWebhook, processWebhookQueue, addWebhookPayloadToQueue } from './webhook.service';
import { db } from '../db/database';
import { WebhookRegisterRequest, Webhook } from '../types/webhook.d';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

vi.mock('node-fetch');

// Helper function to mock fetch
const mockFetch = vi.fn();


const mockWebhook: Webhook = {
    id: 'test-id',
    callbackUrl: 'http://example.com/webhook',
    secret: 'secret',
    events: ['event1', 'event2'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// Mock the database prepare and run methods
const mockPrepare = vi.fn();
const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();


beforeEach(() => {
  vi.clearAllMocks();

  // Mock the database methods
  vi.spyOn(db, 'prepare').mockImplementation(() => mockPrepare as any);
  vi.spyOn(db, 'exec');

  mockPrepare.mockImplementation(() => ({
      run: mockRun,
      get: mockGet,
      all: mockAll,
  }) as any);
  

  // Reset fetch mock
  (fetch as any).mockImplementation(mockFetch);
  // mockFetch.mockResolvedValue({ ok: true });
});


describe('Webhook Service', () => {

    it('createWebhook should create a webhook', async () => {
        const webhookData: WebhookRegisterRequest = {
            callbackUrl: 'http://example.com/webhook',
            events: ['event1', 'event2'],
            secret: 'secret'
        };

        mockRun.mockReturnValue({ changes: 1 });

        const result = await createWebhook(webhookData);

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO webhooks'));
        expect(mockRun).toHaveBeenCalled();
        expect(result.callbackUrl).toBe(webhookData.callbackUrl);
    });

    it('getWebhook should return a webhook', async () => {
        mockGet.mockReturnValue({...mockWebhook, events: JSON.stringify(mockWebhook.events)});

        const result = await getWebhook('test-id');

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM webhooks'));
        expect(mockGet).toHaveBeenCalled();
        expect(result?.id).toBe('test-id');
    });

    it('listWebhooks should return a list of webhooks', async () => {
        mockAll.mockReturnValue([{...mockWebhook, events: JSON.stringify(mockWebhook.events)}]);

        const result = await listWebhooks();

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM webhooks'));
        expect(mockAll).toHaveBeenCalled();
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('test-id');
    });

    it('deleteWebhook should delete a webhook', async () => {
        mockRun.mockReturnValue({ changes: 1 });

        const result = await deleteWebhook('test-id');

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM webhooks'));
        expect(mockRun).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('processWebhookQueue should call the webhook', async () => {
        mockGet.mockReturnValue({...mockWebhook, events: JSON.stringify(mockWebhook.events)});
        mockFetch.mockResolvedValue({ ok: true });

        await processWebhookQueue('test-id', { data: 'payload' });

        expect(mockFetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, expect.objectContaining({ method: 'POST' }));
    });

    it('processWebhookQueue should handle webhook call failure', async () => {
        mockGet.mockReturnValue({...mockWebhook, events: JSON.stringify(mockWebhook.events)});
        mockFetch.mockResolvedValue({ ok: false, status: 500 });

        await processWebhookQueue('test-id', { data: 'payload' });

        expect(mockFetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, expect.objectContaining({ method: 'POST' }));
    });

    it('addWebhookPayloadToQueue should call processWebhookQueue', async () => {
        const processQueueSpy = vi.spyOn(await import('./webhook.service'), 'processWebhookQueue');

        await addWebhookPayloadToQueue('test-id', { data: 'payload' });

        expect(processQueueSpy).toHaveBeenCalledWith('test-id', { data: 'payload' });
    });
});
