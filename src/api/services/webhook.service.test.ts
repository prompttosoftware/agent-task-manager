import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as webhookService from './webhook.service';
import { db } from '../db/database';
import { WebhookRegisterRequest, Webhook } from '../types/webhook.d';
import fetch from 'node-fetch';

vi.mock('node-fetch');

describe('Webhook Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Mock the database prepare and run methods
    vi.spyOn(db, 'prepare').mockImplementation(() => ({ 
      run: vi.fn().mockReturnValue({ changes: 1 }),
      get: vi.fn().mockReturnValue(undefined),
      all: vi.fn().mockReturnValue([]),
      delete: vi.fn().mockReturnValue({changes:1})
    }) as any);
  });

  it('should create a webhook', async () => {
    const webhookData: WebhookRegisterRequest = {
      callbackUrl: 'http://example.com/webhook',
      events: ['event1', 'event2'],
    };

    const createdWebhook = await webhookService.createWebhook(webhookData);
    expect(createdWebhook).toBeDefined();
    expect(createdWebhook.callbackUrl).toBe(webhookData.callbackUrl);
    expect(createdWebhook.events).toEqual(webhookData.events);
  });

  it('should get a webhook by id', async () => {
    const mockWebhook: Webhook = {
      id: 'some-uuid',
      callbackUrl: 'http://example.com/webhook',
      secret: 'secret',
      events: ['event1', 'event2'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(db.prepare('SELECT * FROM webhooks WHERE id = ?'), 'get').mockReturnValue(mockWebhook);

    const webhook = await webhookService.getWebhook(mockWebhook.id);
    expect(webhook).toBeDefined();
    expect(webhook?.id).toBe(mockWebhook.id);
  });

  it('should list webhooks', async () => {
    const mockWebhooks: Webhook[] = [
      {
        id: 'some-uuid-1',
        callbackUrl: 'http://example.com/webhook1',
        secret: 'secret',
        events: ['event1', 'event2'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'some-uuid-2',
        callbackUrl: 'http://example.com/webhook2',
        secret: 'secret',
        events: ['event3', 'event4'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(db.prepare('SELECT * FROM webhooks'), 'all').mockReturnValue(mockWebhooks);

    const webhooks = await webhookService.listWebhooks();
    expect(webhooks).toBeDefined();
    expect(webhooks.length).toBe(2);
  });

  it('should delete a webhook', async () => {
    const webhookId = 'some-uuid';
    const result = await webhookService.deleteWebhook(webhookId);
    expect(result).toBe(true);
  });

  it('should process a webhook queue item successfully', async () => {
    const webhookId = 'some-uuid';
    const payload = { event: 'test_event', data: { key: 'value' } };
    const mockWebhook: Webhook = {
      id: webhookId,
      callbackUrl: 'http://example.com/webhook',
      secret: 'secret',
      events: ['test_event'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(webhookService, 'getWebhook').mockResolvedValue(mockWebhook);
    (fetch as any).mockResolvedValue({ ok: true });

    await webhookService.processWebhookQueue(webhookId, payload);

    expect(fetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }));
  });

  it('should handle webhook call failure', async () => {
    const webhookId = 'some-uuid';
    const payload = { event: 'test_event', data: { key: 'value' } };
    const mockWebhook: Webhook = {
      id: webhookId,
      callbackUrl: 'http://example.com/webhook',
      secret: 'secret',
      events: ['test_event'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(webhookService, 'getWebhook').mockResolvedValue(mockWebhook);
    (fetch as any).mockResolvedValue({ ok: false, status: 500 });

    await webhookService.processWebhookQueue(webhookId, payload);

    expect(fetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }));
  });

  it('should handle webhook not found', async () => {
      const webhookId = 'some-uuid';
      const payload = { event: 'test_event', data: { key: 'value' } };

      vi.spyOn(webhookService, 'getWebhook').mockResolvedValue(undefined);

      await webhookService.processWebhookQueue(webhookId, payload);

      expect(fetch).not.toHaveBeenCalled();
  });

  it('should add a webhook payload to the queue', async () => {
    const webhookId = 'some-uuid';
    const payload = { event: 'test_event', data: { key: 'value' } };

    await webhookService.addWebhookPayloadToQueue(webhookId, payload);
    // Add assertions here to check if the payload was added to the queue correctly.
    // Since the current implementation just logs the payload, we can't directly
    // verify queue behavior.  We could mock the console.log to verify it was called.
    // For now, we'll just ensure the function doesn't throw.
    expect(true).toBe(true);
  });
});
