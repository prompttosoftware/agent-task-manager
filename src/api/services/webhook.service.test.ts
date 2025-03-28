// src/api/services/webhook.service.test.ts
import { WebhookService } from '../api/services/webhook.service';
import { Webhook, WebhookRegisterRequest, WebhookPayload, WebhookQueueItem } from '../types/webhook.d';
import Database from '../../src/db/database';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Mock the database
jest.mock('../../src/db/database');

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockDb: any; // Use 'any' or a more specific type for your mock Database

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      all: jest.fn(),
      get: jest.fn(),
    };
    (Database as any).mockImplementation(() => mockDb);
    webhookService = new WebhookService(new Database(':memory:')); // Pass a dummy database name
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a webhook', async () => {
    const request: WebhookRegisterRequest = {
      callbackUrl: 'https://example.com/webhook',
      events: ['issue_created'],
    };
    const mockId = uuidv4();
    mockDb.run.mockReturnValue({ changes: 1 });

    (uuidv4 as jest.Mock).mockReturnValue(mockId);

    const result = await webhookService.createWebhook(request);

    expect(mockDb.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO webhooks'),
      expect.arrayContaining([mockId, request.callbackUrl, JSON.stringify(request.events), null, 'active', expect.any(String), expect.any(String)])
    );
    expect(result.id).toBe(mockId);
    expect(result.callbackUrl).toBe(request.callbackUrl);
    expect(result.events).toEqual(request.events);
  });

  it('should delete a webhook', async () => {
    const webhookId = uuidv4();
    mockDb.run.mockReturnValue({ changes: 1 });

    const result = await webhookService.deleteWebhook(webhookId);

    expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    expect(result).toBe(true);
  });

  it('should return false if delete fails', async () => {
    const webhookId = uuidv4();
    mockDb.run.mockReturnValue({ changes: 0 });

    const result = await webhookService.deleteWebhook(webhookId);

    expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    expect(result).toBe(false);
  });

  it('should list webhooks', async () => {
    const mockWebhooks: any[] = [
      {
        id: uuidv4(),
        callbackUrl: 'https://example.com/webhook1',
        events: JSON.stringify(['issue_created']),
        secret: 'secret1',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        callbackUrl: 'https://example.com/webhook2',
        events: JSON.stringify(['issue_updated']),
        secret: 'secret2',
        status: 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    mockDb.all.mockReturnValue(mockWebhooks);

    const result = await webhookService.listWebhooks();

    expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM webhooks');
    expect(result.length).toBe(2);
    expect(result[0].callbackUrl).toBe('https://example.com/webhook1');
    expect(result[0].status).toBe('active');
    expect(result[1].status).toBe('inactive');
  });

  it('should get a webhook by id', async () => {
    const webhookId = uuidv4();
    const mockWebhook: any = {
      id: webhookId,
      callbackUrl: 'https://example.com/webhook',
      events: JSON.stringify(['issue_created']),
      secret: 'secret',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.get.mockReturnValue(mockWebhook);

    const result = await webhookService.getWebhook(webhookId);

    expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', [webhookId]);
    expect(result?.callbackUrl).toBe('https://example.com/webhook');
    expect(result?.status).toBe('active');
  });

  it('should enqueue a webhook', () => {
      const webhookId = uuidv4();
      const payload = { event: 'test_event', data: { test: 'data' } };
      webhookService.enqueueWebhook(webhookId, payload);

      const queue = webhookService.getWebhookQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].webhookId).toBe(webhookId);
      expect(queue[0].payload).toEqual(payload);
      expect(queue[0].timestamp).toBeDefined();
    });

  it('should dequeue a webhook', () => {
      const webhookId = uuidv4();
      const payload = { event: 'test_event', data: { test: 'data' } };
      webhookService.enqueueWebhook(webhookId, payload);

      const dequeuedItem = webhookService.dequeueWebhook();

      expect(dequeuedItem?.webhookId).toBe(webhookId);
      expect(dequeuedItem?.payload).toEqual(payload);
      expect(webhookService.getWebhookQueue().length).toBe(0);
    });

  it('should process webhook event and invoke webhook', async () => {
    const webhookId = uuidv4();
    const mockWebhook: Webhook = {
      id: webhookId,
      callbackUrl: 'https://example.com/webhook',
      events: ['issue_created'],
      secret: 'secret',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockPayload: WebhookPayload = {
      event: 'issue_created',
      data: { issue: 'ISSUE-123' },
      timestamp: new Date().toISOString(),
      webhookId: webhookId,
    };

    const mockWebhooks = [mockWebhook];
    mockDb.all.mockReturnValue(mockWebhooks);

    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as any; // Type assertion

    await webhookService.processWebhookEvent(mockPayload);

    expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND status = ?', ['%issue_created%', 'active']);
    expect(mockFetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': expect.any(String),
      },
      body: JSON.stringify(mockPayload),
    });
  });

    it('should not invoke webhook if event does not match', async () => {
        const webhookId = uuidv4();
        const mockWebhook: Webhook = {
            id: webhookId,
            callbackUrl: 'https://example.com/webhook',
            events: ['issue_updated'], // Different event
            secret: 'secret',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const mockPayload: WebhookPayload = {
            event: 'issue_created',
            data: { issue: 'ISSUE-123' },
            timestamp: new Date().toISOString(),
            webhookId: webhookId,
        };

        const mockWebhooks = [mockWebhook];
        mockDb.all.mockReturnValue(mockWebhooks);

        const mockFetch = jest.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch as any; // Type assertion

        await webhookService.processWebhookEvent(mockPayload);

        expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND status = ?', ['%issue_created%', 'active']);
        expect(mockFetch).not.toHaveBeenCalled();
    });

  it('should handle errors during webhook invocation', async () => {
    const webhookId = uuidv4();
    const mockWebhook: Webhook = {
      id: webhookId,
      callbackUrl: 'https://example.com/webhook',
      events: ['issue_created'],
      secret: 'secret',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockPayload: WebhookPayload = {
      event: 'issue_created',
      data: { issue: 'ISSUE-123' },
      timestamp: new Date().toISOString(),
      webhookId: webhookId,
    };

    const mockWebhooks = [mockWebhook];
    mockDb.all.mockReturnValue(mockWebhooks);

    const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    global.fetch = mockFetch as any; // Type assertion

    await webhookService.processWebhookEvent(mockPayload);

    expect(mockFetch).toHaveBeenCalledWith(mockWebhook.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': expect.any(String),
      },
      body: JSON.stringify(mockPayload),
    });
  });

    it('should generate a signature', () => {
        const secret = 'mysecret';
        const data = '{"event":"issue_created","data":{"issue":"ISSUE-123"},"timestamp":"2024-01-01T00:00:00.000Z","webhookId":"some-webhook-id"}';

        const signature = webhookService.generateSignature(data, secret);

        expect(signature).toBeDefined();
        expect(signature).toMatch(/^[0-9a-f]{64}$/); // Check if it's a hex string
    });
});
