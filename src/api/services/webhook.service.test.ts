// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookService } from './webhook.service';
import { Database } from '../../src/db/database';
import { WebhookRegisterRequest, Webhook, WebhookPayload } from '../types/webhook';

// Mock the Database
vi.mock('../../src/db/database');

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockDatabase: Database;

  beforeEach(() => {
    // Initialize the mock database and service before each test
    mockDatabase = new Database(':memory:'); // Using in-memory database for testing
    vi.spyOn(mockDatabase, 'run');
    vi.spyOn(mockDatabase, 'all');
    vi.spyOn(mockDatabase, 'get');
    webhookService = new WebhookService(mockDatabase);
  });

  it('should be defined', () => {
    expect(webhookService).toBeDefined();
  });

  describe('registerWebhook', () => {
    it('should register a webhook successfully', async () => {
      const request: WebhookRegisterRequest = {
        url: 'https://example.com/webhook',
        events: ['task.created', 'task.updated'],
        secret: 'mysecret',
      };

      const mockRun = vi.spyOn(mockDatabase, 'run').mockResolvedValue({ changes: 1 } as any);

      const result = await webhookService.registerWebhook(request);

      expect(result.url).toBe(request.url);
      expect(result.events).toEqual(request.events);
      expect(mockRun).toHaveBeenCalled();
    });

    it('should handle errors during registration', async () => {
      const request: WebhookRegisterRequest = {
        url: 'https://example.com/webhook',
        events: ['task.created', 'task.updated'],
        secret: 'mysecret',
      };

      const mockRun = vi.spyOn(mockDatabase, 'run').mockRejectedValue(new Error('Database error'));

      await expect(webhookService.registerWebhook(request)).rejects.toThrow('Failed to register webhook: Database error');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      const webhookId = 'some-uuid';
      const mockRun = vi.spyOn(mockDatabase, 'run').mockResolvedValue({ changes: 1 } as any);
      const result = await webhookService.deleteWebhook(webhookId);

      expect(result.success).toBe(true);
      expect(result.webhookId).toBe(webhookId);
      expect(mockRun).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    });

    it('should return not found if webhook does not exist', async () => {
      const webhookId = 'some-uuid';
      const mockRun = vi.spyOn(mockDatabase, 'run').mockResolvedValue({ changes: 0 } as any);

      const result = await webhookService.deleteWebhook(webhookId);

      expect(result.success).toBe(false);
      expect(result.webhookId).toBe(webhookId);
      expect(mockRun).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    });

    it('should handle errors during deletion', async () => {
      const webhookId = 'some-uuid';
      const mockRun = vi.spyOn(mockDatabase, 'run').mockRejectedValue(new Error('Database error'));

      await expect(webhookService.deleteWebhook(webhookId)).rejects.toThrow('Failed to delete webhook: Database error');
      expect(mockRun).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    });
  });

  describe('listWebhooks', () => {
    it('should list webhooks successfully', async () => {
      const mockWebhooks: Webhook[] = [
        {
          id: 'id1',
          url: 'url1',
          events: ['event1'],
          secret: 'secret1',
          active: true,
        },
      ];
      const mockAll = vi.spyOn(mockDatabase, 'all').mockResolvedValue([
        {
          id: 'id1',
          url: 'url1',
          events: JSON.stringify(['event1']),
          secret: 'secret1',
          active: 1,
        },
      ] as any);

      const result = await webhookService.listWebhooks();

      expect(result.webhooks).toEqual(mockWebhooks);
      expect(result.total).toBe(1);
      expect(mockAll).toHaveBeenCalledWith('SELECT * FROM webhooks');
    });

    it('should handle errors during listing', async () => {
      const mockAll = vi.spyOn(mockDatabase, 'all').mockRejectedValue(new Error('Database error'));

      await expect(webhookService.listWebhooks()).rejects.toThrow('Failed to list webhooks: Database error');
      expect(mockAll).toHaveBeenCalledWith('SELECT * FROM webhooks');
    });
  });

  describe('getWebhookById', () => {
    it('should get a webhook by id successfully', async () => {
      const mockWebhook: Webhook = {
        id: 'id1',
        url: 'url1',
        events: ['event1'],
        secret: 'secret1',
        active: true,
      };
      const mockGet = vi.spyOn(mockDatabase, 'get').mockResolvedValue({
        id: 'id1',
        url: 'url1',
        events: JSON.stringify(['event1']),
        secret: 'secret1',
        active: 1,
      } as any);

      const result = await webhookService.getWebhookById('id1');

      expect(result).toEqual(mockWebhook);
      expect(mockGet).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', ['id1']);
    });

    it('should return undefined if webhook not found', async () => {
      const mockGet = vi.spyOn(mockDatabase, 'get').mockResolvedValue(undefined);

      const result = await webhookService.getWebhookById('id1');

      expect(result).toBeUndefined();
      expect(mockGet).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', ['id1']);
    });

    it('should handle errors during retrieval', async () => {
      const mockGet = vi.spyOn(mockDatabase, 'get').mockRejectedValue(new Error('Database error'));

      await expect(webhookService.getWebhookById('id1')).rejects.toThrow('Failed to get webhook by id: Database error');
      expect(mockGet).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', ['id1']);
    });
  });

  describe('processWebhookEvent', () => {
    it('should process webhook events and invoke webhooks', async () => {
      const mockPayload: WebhookPayload = {
        event: 'task.created',
        data: { taskId: '123', description: 'New Task' },
      };
      const mockWebhooks: Webhook[] = [
        {
          id: 'id1',
          url: 'url1',
          events: ['task.created'],
          secret: 'secret1',
          active: true,
        },
      ];
      const mockAll = vi.spyOn(mockDatabase, 'all').mockResolvedValue([
        {
          id: 'id1',
          url: 'url1',
          events: JSON.stringify(['task.created']),
          secret: 'secret1',
          active: 1,
        },
      ] as any);
      const mockInvokeWebhook = vi.spyOn(WebhookService.prototype as any, 'invokeWebhook').mockResolvedValue();

      await webhookService.processWebhookEvent(mockPayload);

      expect(mockAll).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%task.created%']);
      expect(mockInvokeWebhook).toHaveBeenCalled();
    });

    it('should not invoke webhook if event does not match', async () => {
      const mockPayload: WebhookPayload = {
        event: 'task.updated',
        data: { taskId: '123', status: 'in progress' },
      };
      const mockWebhooks: Webhook[] = [
        {
          id: 'id1',
          url: 'url1',
          events: ['task.created'],
          secret: 'secret1',
          active: true,
        },
      ];
      const mockAll = vi.spyOn(mockDatabase, 'all').mockResolvedValue([
        {
          id: 'id1',
          url: 'url1',
          events: JSON.stringify(['task.created']),
          secret: 'secret1',
          active: 1,
        },
      ] as any);
      const mockInvokeWebhook = vi.spyOn(WebhookService.prototype as any, 'invokeWebhook').mockResolvedValue();

      await webhookService.processWebhookEvent(mockPayload);

      expect(mockAll).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%task.updated%']);
      expect(mockInvokeWebhook).not.toHaveBeenCalled();
    });

    it('should handle errors during event processing', async () => {
      const mockPayload: WebhookPayload = {
        event: 'task.created',
        data: { taskId: '123', description: 'New Task' },
      };

      const mockAll = vi.spyOn(mockDatabase, 'all').mockRejectedValue(new Error('Database error'));

      await expect(webhookService.processWebhookEvent(mockPayload)).rejects.toThrow('Failed to process webhook event: Database error');
      expect(mockAll).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%task.created%']);
    });
  });

  describe('invokeWebhook', () => {
    it('should invoke webhook successfully with secret', async () => {
      const webhook: Webhook = {
        id: 'id1',
        url: 'url1',
        events: ['task.created'],
        secret: 'secret1',
        active: true,
      };
      const mockPayload: WebhookPayload = {
        event: 'task.created',
        data: { taskId: '123', description: 'New Task' },
      };

      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      const mockGenerateSignature = vi.spyOn(WebhookService.prototype as any, 'generateSignature').mockReturnValue('signature');

      await (webhookService as any).invokeWebhook(webhook, mockPayload);

      expect(global.fetch).toHaveBeenCalledWith('url1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'signature',
        },
        body: JSON.stringify(mockPayload),
      });
      expect(mockGenerateSignature).toHaveBeenCalledWith(JSON.stringify(mockPayload), 'secret1');
    });

    it('should invoke webhook successfully without secret', async () => {
      const webhook: Webhook = {
        id: 'id1',
        url: 'url1',
        events: ['task.created'],
        secret: undefined,
        active: true,
      };
      const mockPayload: WebhookPayload = {
        event: 'task.created',
        data: { taskId: '123', description: 'New Task' },
      };

      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await (webhookService as any).invokeWebhook(webhook, mockPayload);

      expect(global.fetch).toHaveBeenCalledWith('url1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPayload),
      });
    });

    it('should handle fetch errors', async () => {
      const webhook: Webhook = {
        id: 'id1',
        url: 'url1',
        events: ['task.created'],
        secret: 'secret1',
        active: true,
      };
      const mockPayload: WebhookPayload = {
        event: 'task.created',
        data: { taskId: '123', description: 'New Task' },
      };

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      await (webhookService as any).invokeWebhook(webhook, mockPayload);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('generateSignature', () => {
    it('should generate a signature correctly', () => {
      const data = 'test data';
      const secret = 'test secret';
      const expectedSignature = 'f7df6b90c0b6f7a7d7653867297a06b01f9335cd180a30a3e410550db0d5f613';

      const signature = (webhookService as any).generateSignature(data, secret);

      expect(signature).toBe(expectedSignature);
    });
  });
});