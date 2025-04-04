// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createWebhook,
    getWebhook,
    listWebhooks,
    deleteWebhook,
    processWebhookQueue,
    addWebhookPayloadToQueue,
    sendWebhook
} from './webhook.service';
import { db } from '../../db/database';
import { WebhookRegisterRequest, Webhook } from '../types/webhook.d';
import fetch from 'node-fetch';
import * as webhookProcessing from '../../services/webhookProcessing';

vi.mock('node-fetch');
vi.mock('../../services/webhookProcessing');


// Helper function to mock fetch
const mockFetch = vi.fn();

const mockWebhook: Webhook = {
    id: 'test-id',
    callbackUrl: 'http://example.com/webhook',
    secret: 'secret',
    events: ['event1', 'event2'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    headers: {
        'X-Custom-Header': 'custom-value'
    }
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
            secret: 'secret',
            headers: {
                'X-Custom-Header': 'custom-value'
            }
        };

        mockRun.mockReturnValue({ changes: 1 });

        const result = await createWebhook(webhookData);

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO webhooks'));
        expect(mockRun).toHaveBeenCalled();
        expect(result.callbackUrl).toBe(webhookData.callbackUrl);
        expect(result.secret).toBe(webhookData.secret);
        expect(result.events).toEqual(webhookData.events);
    });

    it('getWebhook should return a webhook', async () => {
        mockGet.mockReturnValue({ ...mockWebhook, events: JSON.stringify(mockWebhook.events), headers: JSON.stringify(mockWebhook.headers) });

        const result = await getWebhook('test-id');

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM webhooks'));
        expect(mockGet).toHaveBeenCalled();
        expect(result?.id).toBe('test-id');
        expect(result?.headers).toEqual(mockWebhook.headers);
    });

    it('listWebhooks should return a list of webhooks', async () => {
        mockAll.mockReturnValue([{ ...mockWebhook, events: JSON.stringify(mockWebhook.events), headers: JSON.stringify(mockWebhook.headers) }]);

        const result = await listWebhooks();

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM webhooks'));
        expect(mockAll).toHaveBeenCalled();
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('test-id');
        expect(result[0].headers).toEqual(mockWebhook.headers);
    });

    it('deleteWebhook should delete a webhook', async () => {
        mockRun.mockReturnValue({ changes: 1 });

        const result = await deleteWebhook('test-id');

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM webhooks'));
        expect(mockRun).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('processWebhookQueue should call the webhook', async () => {
        mockGet.mockReturnValue({ ...mockWebhook, events: JSON.stringify(mockWebhook.events), headers: JSON.stringify(mockWebhook.headers) });
        mockFetch.mockResolvedValue({ ok: true });

        await processWebhookQueue('test-id', { event: 'test-event', data: { payload: 'payload' }, webhookId: 'test-id', timestamp: new Date().toISOString() });

        expect(mockFetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, expect.objectContaining({ method: 'POST' }));
        expect(mockFetch).toHaveBeenCalledWith(
            mockWebhook.callbackUrl,
            expect.objectContaining({
                body: JSON.stringify({ event: 'test-event', data: { payload: 'payload' }, webhookId: 'test-id', timestamp: expect.any(String) }),
            })
        );
        expect(mockFetch).toHaveBeenCalledWith(
            mockWebhook.callbackUrl,
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'X-Custom-Header': 'custom-value',
                    'X-Webhook-Signature': expect.any(String),
                }),
            })
        );
    });

    it('processWebhookQueue should handle webhook call failure', async () => {
        mockGet.mockReturnValue({ ...mockWebhook, events: JSON.stringify(mockWebhook.events), headers: JSON.stringify(mockWebhook.headers) });
        mockFetch.mockResolvedValue({ ok: false, status: 500 });

        await processWebhookQueue('test-id', { event: 'test-event', data: { payload: 'payload' }, webhookId: 'test-id', timestamp: new Date().toISOString() });

        expect(mockFetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, expect.objectContaining({ method: 'POST' }));
    });

    it('addWebhookPayloadToQueue should call enqueueWebhook from webhookProcessing', async () => {
        const enqueueWebhookMock = vi.fn();
        vi.mocked(webhookProcessing.enqueueWebhook).mockResolvedValue({ id: 'job-id' } as any);

        await addWebhookPayloadToQueue('test-id', { event: 'test-event', data: { payload: 'payload' }, webhookId: 'test-id', timestamp: new Date().toISOString() });

        expect(webhookProcessing.enqueueWebhook).toHaveBeenCalledWith(expect.objectContaining({ event: 'test-event' }));
    });

    it('sendWebhook should send a webhook request with headers', async () => {
        mockFetch.mockResolvedValue({ ok: true });

        const callbackUrl = 'http://example.com/callback';
        const requestBody = JSON.stringify({ data: 'test' });
        const headers = {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value'
        };

        await sendWebhook(callbackUrl, requestBody, headers);

        expect(mockFetch).toHaveBeenCalledWith(callbackUrl, expect.objectContaining({
            method: 'POST',
            body: requestBody,
            headers: {
                'Content-Type': 'application/json',
                'X-Custom-Header': 'custom-value'
            }
        }));
    });

    it('sendWebhook should handle fetch errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const callbackUrl = 'http://example.com/callback';
        const requestBody = JSON.stringify({ data: 'test' });
        const headers = {
            'Content-Type': 'application/json',
        };

        try {
            await sendWebhook(callbackUrl, requestBody, headers);
        } catch (error: any) {
            expect(error.message).toBe('Network error');
        }
    });
});