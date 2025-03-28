// src/api/services/webhook.service.test.ts
import { test, describe, expect, beforeEach, vi } from 'vitest';
import { WebhookService } from './webhook.service';
import { getDB } from '../../src/db/database';
import { mock } from 'vitest-mock-extended';
import { WebhookRegisterRequest, Webhook, WebhookPayload } from '../types/webhook.d';

vi.mock('../../src/db/database');

const mockDB = mock<any>();

describe('Webhook Service', () => {
  let service: WebhookService;
  beforeEach(() => {
    vi.clearAllMocks();
    (getDB as jest.Mock).mockReturnValue(mockDB);
    service = new WebhookService(mockDB);
  });

  describe('registerWebhook', () => {
    it('should register a webhook successfully', async () => {
      const webhook: WebhookRegisterRequest = {
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
      };
      const expectedWebhook: Webhook = {
        id: expect.any(String),
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        active: true,
      };

      mockDB.run.mockResolvedValue({ changes: 1 });

      const result = await service.registerWebhook(webhook);

      expect(mockDB.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO webhooks'),
        expect.any(String),
        webhook.url,
        JSON.stringify(webhook.events),
        webhook.secret,
        1
      );
      expect(result).toMatchObject(expectedWebhook);
    });

    it('should handle database errors', async () => {
      const webhook: WebhookRegisterRequest = {
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
      };
      mockDB.run.mockRejectedValue(new Error('DB Error'));

      await expect(service.registerWebhook(webhook)).rejects.toThrow('Failed to register webhook: DB Error');
      expect(mockDB.run).toHaveBeenCalled();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      mockDB.run.mockResolvedValue({ changes: 1 });

      const result = await service.deleteWebhook('123');

      expect(result).toEqual({ message: 'Webhook deleted', webhookId: '123', success: true });
      expect(mockDB.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', ['123']);
    });

    it('should handle webhook not found', async () => {
      mockDB.run.mockResolvedValue({ changes: 0 });

      const result = await service.deleteWebhook('123');

      expect(result).toEqual({ message: 'Webhook not found', webhookId: '123', success: false });
      expect(mockDB.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', ['123']);
    });

    it('should handle database errors during deletion', async () => {
      mockDB.run.mockRejectedValue(new Error('DB Error'));

      await expect(service.deleteWebhook('123')).rejects.toThrow('Failed to delete webhook: DB Error');
      expect(mockDB.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', ['123']);
    });
  });

  describe('listWebhooks', () => {
    it('should get all webhooks successfully', async () => {
      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          url: 'https://example.com',
          events: ['event1'],
          secret: 'secret',
          active: true,
        },
      ];
      mockDB.all.mockResolvedValue([
        {
          id: '1',
          url: 'https://example.com',
          events: JSON.stringify(['event1']),
          secret: 'secret',
          active: 1,
        },
      ]);

      const result = await service.listWebhooks();

      expect(result).toEqual({ webhooks: mockWebhooks, total: 1 });
      expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks');
    });

    it('should handle database errors during get all', async () => {
      mockDB.all.mockRejectedValue(new Error('DB Error'));

      await expect(service.listWebhooks()).rejects.toThrow('Failed to list webhooks: DB Error');
      expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks');
    });
  });

  describe('getWebhookById', () => {
    it('should get webhook by id successfully', async () => {
      const mockWebhook: Webhook = {
        id: '1',
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
        active: true,
      };
      mockDB.get.mockResolvedValue({
        id: '1',
        url: 'https://example.com',
        events: JSON.stringify(['event1']),
        secret: 'secret',
        active: 1,
      });

      const result = await service.getWebhookById('1');

      expect(result).toEqual(mockWebhook);
      expect(mockDB.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', ['1']);
    });

    it('should return undefined if webhook is not found', async () => {
      mockDB.get.mockResolvedValue(undefined);

      const result = await service.getWebhookById('1');

      expect(result).toBeUndefined();
      expect(mockDB.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', ['1']);
    });

    it('should handle database errors', async () => {
      mockDB.get.mockRejectedValue(new Error('DB Error'));

      await expect(service.getWebhookById('1')).rejects.toThrow('Failed to get webhook by id: DB Error');
      expect(mockDB.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', ['1']);
    });
  });

  describe('processWebhookEvent', () => {
    it('should process webhook event successfully', async () => {
      const payload: WebhookPayload = {
        event: 'event1',
        data: { some: 'data' },
      };
      const mockWebhook: Webhook = {
        id: '1',
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
        active: true,
      };
      mockDB.all.mockResolvedValue([
        {
          id: '1',
          url: 'https://example.com',
          events: JSON.stringify(['event1']),
          secret: 'secret',
          active: 1,
        },
      ]);
      // Mock the invokeWebhook function
      const invokeWebhookSpy = vi.spyOn(service, 'invokeWebhook' as any);

      await service.processWebhookEvent(payload);

      expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%event1%']);
      expect(invokeWebhookSpy).toHaveBeenCalledWith(mockWebhook, payload);
    });

    it('should not invoke webhook if event does not match', async () => {
      const payload: WebhookPayload = {
        event: 'event2',
        data: { some: 'data' },
      };

      mockDB.all.mockResolvedValue([
        {
          id: '1',
          url: 'https://example.com',
          events: JSON.stringify(['event1']),
          secret: 'secret',
          active: 1,
        },
      ]);
      // Mock the invokeWebhook function
      const invokeWebhookSpy = vi.spyOn(service, 'invokeWebhook' as any);

      await service.processWebhookEvent(payload);

      expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%event2%']);
      expect(invokeWebhookSpy).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const payload: WebhookPayload = {
        event: 'event1',
        data: { some: 'data' },
      };
      mockDB.all.mockRejectedValue(new Error('DB Error'));

      await expect(service.processWebhookEvent(payload)).rejects.toThrow('Failed to process webhook event: DB Error');
      expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%event1%']);
    });
  });

  describe('invokeWebhook', () => {
    it('should invoke webhook successfully with secret', async () => {
      const webhook: Webhook = {
        id: '1',
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
        active: true,
      };
      const payload: WebhookPayload = {
        event: 'event1',
        data: { some: 'data' },
      };

      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;
      const generateSignatureSpy = vi.spyOn(service, 'generateSignature' as any).mockReturnValue('signature');

      await (service as any).invokeWebhook(webhook, payload);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'signature',
        },
        body: JSON.stringify(payload),
      });
      expect(generateSignatureSpy).toHaveBeenCalledWith(JSON.stringify(payload), 'secret');
    });

    it('should invoke webhook successfully without secret', async () => {
      const webhook: Webhook = {
        id: '1',
        url: 'https://example.com',
        events: ['event1'],
        secret: undefined,
        active: true,
      };
      const payload: WebhookPayload = {
        event: 'event1',
        data: { some: 'data' },
      };

      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await (service as any).invokeWebhook(webhook, payload);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });

    it('should handle fetch errors', async () => {
      const webhook: Webhook = {
        id: '1',
        url: 'https://example.com',
        events: ['event1'],
        secret: 'secret',
        active: true,
      };
      const payload: WebhookPayload = {
        event: 'event1',
        data: { some: 'data' },
      };

      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      global.fetch = mockFetch;

      await (service as any).invokeWebhook(webhook, payload);

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('generateSignature', () => {
    it('should generate a signature', () => {
      const data = '{"event":"event1","data":{"some":"data"}}';
      const secret = 'secret';
      const expectedSignature = 'b03ef1a93e04709203c8288d502b917c12435788c5a7bb6f21533582c82b98e2';

      const signature = (service as any).generateSignature(data, secret);

      expect(signature).toBe(expectedSignature);
    });
  });
});