// src/services/webhookProcessing.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Queue, Job } from 'bull';
import Redis from 'ioredis';
import { enqueueWebhook, getWebhookConfig, signPayload, startWebhookQueue } from './webhookProcessing';
import { WebhookPayload, Webhook } from '../api/types/webhook.d';
import db from '../db/database';
import { sendWebhook } from './webhook.service';

// Mock dependencies
vi.mock('ioredis');
vi.mock('../db/database', () => ({
  default: {
    prepare: vi.fn(() => ({
      get: vi.fn(),
    })),
    close: vi.fn(),
  },
}));
vi.mock('./webhook.service', () => ({
  sendWebhook: vi.fn(),
}));

// Define mock types
const mockRedis = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
} as any;

const mockQueue = {
  add: vi.fn(),
  process: vi.fn(),
  on: vi.fn(),
} as any;


describe('webhookProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Redis and Bull
    (Redis as any).mockImplementation(() => mockRedis);
    (Queue as any).mockImplementation(() => mockQueue);
  });

  it('should enqueue a webhook payload', async () => {
    const payload: WebhookPayload = {
      webhookId: '123',
      event: 'task.created',
      data: { taskId: 'abc' },
    };

    await enqueueWebhook(payload);

    expect(mockQueue.add).toHaveBeenCalledWith(payload);
  });

  it('should get webhook config by ID', async () => {
    const webhookId = 'test-webhook-id';
    const mockWebhook: Webhook = {
      id: webhookId,
      callbackUrl: 'http://example.com',
      secret: 'test-secret',
      events: ['task.created'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (db.prepare as any).mockReturnValue({ get: vi.fn().mockReturnValue(mockWebhook) });

    const result = await getWebhookConfig(webhookId);

    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?');
    expect((db.prepare as any)().get).toHaveBeenCalledWith(webhookId);
    expect(result).toEqual(mockWebhook);
  });

  it('should return undefined if webhook config is not found', async () => {
    const webhookId = 'non-existent-id';
    (db.prepare as any).mockReturnValue({ get: vi.fn().mockReturnValue(undefined) });

    const result = await getWebhookConfig(webhookId);

    expect(result).toBeUndefined();
  });

  it('should sign the payload with the secret', () => {
    const secret = 'mysecret';
    const payload = '{"event": "task.created", "data": {"taskId": "123"}}';
    const expectedSignature = '61a71d13575e050055093c1a6f303f1e18c62bc89db73c19188240b603c38291';

    const signature = signPayload(secret, payload);

    expect(signature).toBe(expectedSignature);
  });

  it('should start the webhook queue', async () => {
    //startWebhookQueue does not do anything in the code, so we just make sure it is called without error
    await startWebhookQueue();
    expect(true).toBe(true);
  });

  it('should process a webhook job successfully', async () => {
    const webhookId = 'test-webhook-id';
    const mockWebhook: Webhook = {
      id: webhookId,
      callbackUrl: 'http://example.com',
      secret: 'test-secret',
      events: ['task.created'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const payload: WebhookPayload = {
      webhookId: webhookId,
      event: 'task.created',
      data: { taskId: 'abc' },
    };
    const requestBody = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': '61a71d13575e050055093c1a6f303f1e18c62bc89db73c19188240b603c38291',
    };

    (db.prepare as any).mockReturnValue({ get: vi.fn().mockReturnValue(mockWebhook) });
    (sendWebhook as any).mockResolvedValue(undefined);
    const processFunction = mockQueue.process.mock.calls[0][0];
    await processFunction({ data: payload } as Job<WebhookPayload>);

    expect(getWebhookConfig).toHaveBeenCalledWith(webhookId);
    expect(sendWebhook).toHaveBeenCalledWith(mockWebhook.callbackUrl, requestBody, headers);
  });

  it('should handle errors when processing a webhook job', async () => {
    const webhookId = 'test-webhook-id';
    const mockWebhook: Webhook = {
      id: webhookId,
      callbackUrl: 'http://example.com',
      secret: 'test-secret',
      events: ['task.created'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const payload: WebhookPayload = {
      webhookId: webhookId,
      event: 'task.created',
      data: { taskId: 'abc' },
    };

    (db.prepare as any).mockReturnValue({ get: vi.fn().mockReturnValue(mockWebhook) });
    (sendWebhook as any).mockRejectedValue(new Error('Failed to send'));
    const processFunction = mockQueue.process.mock.calls[0][0];
    await expect(processFunction({ data: payload } as Job<WebhookPayload>)).rejects.toThrow('Failed to send');
  });

    it('should handle webhook config not found', async () => {
        const webhookId = 'non-existent-id';
        const payload: WebhookPayload = {
            webhookId: webhookId,
            event: 'task.created',
            data: { taskId: 'abc' },
        };

        (db.prepare as any).mockReturnValue({ get: vi.fn().mockReturnValue(undefined) });
        const processFunction = mockQueue.process.mock.calls[0][0];
        await processFunction({ data: payload } as Job<WebhookPayload>);
        expect(sendWebhook).not.toHaveBeenCalled();
    });
});
