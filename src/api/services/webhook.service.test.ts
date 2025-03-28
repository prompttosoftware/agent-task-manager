// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebhookService } from './webhook.service';
import { Webhook, WebhookRegisterRequest, WebhookDeleteResponse, WebhookListResponse, WebhookPayload } from '../types/webhook.d';
import { Database } from '../../src/db/database';
import * as crypto from 'crypto';

vi.mock('better-sqlite3');

describe('WebhookService', () => {
  let service: WebhookService;
  let mockDB: Database;

  beforeEach(() => {
    mockDB = {
      run: vi.fn(),
      all: vi.fn(),
      get: vi.fn(),
    } as any;
    service = new WebhookService(mockDB);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const webhookRegisterRequest: WebhookRegisterRequest = {
    url: 'http://example.com/webhook',
    events: ['issue.created'],
    secret: 'testSecret',
  };

  const mockWebhook: Webhook = {
    id: 'uuid-1',
    url: webhookRegisterRequest.url,
    events: webhookRegisterRequest.events,
    secret: webhookRegisterRequest.secret,
    active: true,
  };

  it('should register a webhook', async () => {
    const expectedResponse = {
      id: expect.any(String),
      url: webhookRegisterRequest.url,
      events: webhookRegisterRequest.events,
      secret: webhookRegisterRequest.secret,
      status: 'active',
    };

    (mockDB.run as any).mockReturnValue({ changes: 1 });
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as any);

    const result = await service.registerWebhook(webhookRegisterRequest);

    expect(result).toMatchObject(expectedResponse);
    expect(mockDB.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO webhooks'),
      expect.any(Array)
    );
  });

  it('should delete a webhook', async () => {
    const webhookId = 'uuid-1';
    const expectedResponse: WebhookDeleteResponse = { message: 'Webhook deleted', webhookId: webhookId, success: true };

    (mockDB.run as any).mockReturnValue({ changes: 1 });

    const result = await service.deleteWebhook(webhookId);

    expect(result).toEqual(expectedResponse);
    expect(mockDB.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
  });

  it('should return webhook not found when deleting a webhook that does not exist', async () => {
    const webhookId = 'uuid-1';
    const expectedResponse: WebhookDeleteResponse = { message: 'Webhook not found', webhookId: webhookId, success: false };

    (mockDB.run as any).mockReturnValue({ changes: 0 });

    const result = await service.deleteWebhook(webhookId);

    expect(result).toEqual(expectedResponse);
    expect(mockDB.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
  });

  it('should list webhooks', async () => {
    const mockWebhooks: Webhook[] = [mockWebhook];
    const expectedResponse: WebhookListResponse = { webhooks: expect.arrayContaining(mockWebhooks), total: mockWebhooks.length };

    (mockDB.all as any).mockReturnValue([
      {
        id: mockWebhook.id,
        url: mockWebhook.url,
        events: JSON.stringify(mockWebhook.events),
        secret: mockWebhook.secret,
        active: mockWebhook.active ? 1 : 0,
      },
    ]);

    const result = await service.listWebhooks();

    expect(result).toMatchObject(expectedResponse);
    expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks');
  });

  it('should get webhook by id', async () => {
    (mockDB.get as any).mockReturnValue({
      id: mockWebhook.id,
      url: mockWebhook.url,
      events: JSON.stringify(mockWebhook.events),
      secret: mockWebhook.secret,
      active: mockWebhook.active ? 1 : 0,
    });

    const result = await service.getWebhookById(mockWebhook.id);

    expect(result).toMatchObject(mockWebhook);
    expect(mockDB.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', [mockWebhook.id]);
  });

  it('should return undefined if webhook not found by id', async () => {
    (mockDB.get as any).mockReturnValue(undefined);
    const result = await service.getWebhookById(mockWebhook.id);
    expect(result).toBeUndefined();
    expect(mockDB.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', [mockWebhook.id]);
  });

  it('should process webhook event and invoke webhook', async () => {
    const payload: WebhookPayload = {
      event: 'issue.created',
      data: { issueId: 'issue-1' },
    };
    const jsonStringifiedPayload = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', mockWebhook.secret!).update(jsonStringifiedPayload).digest('hex');

    (mockDB.all as any).mockReturnValue([
      {
        id: mockWebhook.id,
        url: mockWebhook.url,
        events: JSON.stringify(mockWebhook.events),
        secret: mockWebhook.secret,
        active: mockWebhook.active ? 1 : 0,
      },
    ]);
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as any);

    await service.processWebhookEvent(payload);

    expect(global.fetch).toHaveBeenCalledWith(mockWebhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      body: jsonStringifiedPayload,
    });
    expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%issue.created%']);
  });

  it('should process webhook event and not invoke webhook if event is not matched', async () => {
    const payload: WebhookPayload = {
      event: 'issue.updated',
      data: { issueId: 'issue-1' },
    };

    (mockDB.all as any).mockReturnValue([
      {
        id: mockWebhook.id,
        url: mockWebhook.url,
        events: JSON.stringify(['issue.created']),
        secret: mockWebhook.secret,
        active: mockWebhook.active ? 1 : 0,
      },
    ]);
    const fetchMock = vi.spyOn(global, 'fetch');

    await service.processWebhookEvent(payload);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%issue.updated%']);
  });

  it('should handle fetch errors', async () => {
    const payload: WebhookPayload = {
      event: 'issue.created',
      data: { issueId: 'issue-1' },
    };

    (mockDB.all as any).mockReturnValue([
      {
        id: mockWebhook.id,
        url: mockWebhook.url,
        events: JSON.stringify(mockWebhook.events),
        secret: mockWebhook.secret,
        active: mockWebhook.active ? 1 : 0,
      },
    ]);

    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    await service.processWebhookEvent(payload);

    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle registerWebhook errors', async () => {
    (mockDB.run as any).mockRejectedValue(new Error('Database error'));

    await expect(service.registerWebhook(webhookRegisterRequest)).rejects.toThrow('Failed to register webhook: Database error');
    expect(mockDB.run).toHaveBeenCalled();
  });

  it('should handle deleteWebhook errors', async () => {
    (mockDB.run as any).mockRejectedValue(new Error('Database error'));

    await expect(service.deleteWebhook('uuid-1')).rejects.toThrow('Failed to delete webhook: Database error');
    expect(mockDB.run).toHaveBeenCalled();
  });

  it('should handle listWebhooks errors', async () => {
    (mockDB.all as any).mockRejectedValue(new Error('Database error'));

    await expect(service.listWebhooks()).rejects.toThrow('Failed to list webhooks: Database error');
    expect(mockDB.all).toHaveBeenCalled();
  });

  it('should handle getWebhookById errors', async () => {
    (mockDB.get as any).mockRejectedValue(new Error('Database error'));

    await expect(service.getWebhookById('uuid-1')).rejects.toThrow('Failed to get webhook by id: Database error');
    expect(mockDB.get).toHaveBeenCalled();
  });

  it('should handle processWebhookEvent errors', async () => {
    const payload: WebhookPayload = {
      event: 'issue.created',
      data: { issueId: 'issue-1' },
    };

    (mockDB.all as any).mockRejectedValue(new Error('Database error'));

    await expect(service.processWebhookEvent(payload)).rejects.toThrow('Failed to process webhook event: Database error');
    expect(mockDB.all).toHaveBeenCalled();
  });

  it('should not invoke webhook if webhook is inactive', async () => {
    const payload: WebhookPayload = {
      event: 'issue.created',
      data: { issueId: 'issue-1' },
    };

    const inactiveWebhook = {
      id: mockWebhook.id,
      url: mockWebhook.url,
      events: JSON.stringify(mockWebhook.events),
      secret: mockWebhook.secret,
      active: 0,
    };

    (mockDB.all as any).mockReturnValue([inactiveWebhook]);
    const fetchMock = vi.spyOn(global, 'fetch');

    await service.processWebhookEvent(payload);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockDB.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ['%issue.created%']);
  });

  it('should handle invalid JSON payload', async () => {
    const payload: WebhookPayload = {
      event: 'issue.created',
      data: { issueId: 'issue-1' },
    };

    const jsonStringifiedPayload = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', mockWebhook.secret!).update(jsonStringifiedPayload).digest('hex');

    (mockDB.all as any).mockReturnValue([
      {
        id: mockWebhook.id,
        url: mockWebhook.url,
        events: JSON.stringify(mockWebhook.events),
        secret: mockWebhook.secret,
        active: mockWebhook.active ? 1 : 0,
      },
    ]);

    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('Failed to parse JSON');
    });

    await service.processWebhookEvent(payload);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('should validate the secret when generating the signature', async () => {
    const payload: WebhookPayload = {
      event: 'issue.created',
      data: { issueId: 'issue-1' },
    };
    const jsonStringifiedPayload = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', mockWebhook.secret!).update(jsonStringifiedPayload).digest('hex');

    (mockDB.all as any).mockReturnValue([
      {
        id: mockWebhook.id,
        url: mockWebhook.url,
        events: JSON.stringify(mockWebhook.events),
        secret: mockWebhook.secret,
        active: mockWebhook.active ? 1 : 0,
      },
    ]);
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as any);

    await service.processWebhookEvent(payload);
    expect(global.fetch).toHaveBeenCalledWith(mockWebhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      body: jsonStringifiedPayload,
    });
  });

  it('should handle different event types', async () => {
    const payload: WebhookPayload = {
      event: 'issue.updated',
      data: { issueId: 'issue-1' },
    };

    (mockDB.all as any).mockReturnValue([
      {
        id: mockWebhook.id,
        url: mockWebhook.url,
        events: JSON.stringify(['issue.updated']),
        secret: mockWebhook.secret,
        active: mockWebhook.active ? 1 : 0,
      },
    ]);

    const fetchMock = vi.spyOn(global, 'fetch');
    const jsonStringifiedPayload = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', mockWebhook.secret!).update(jsonStringifiedPayload).digest('hex');

    await service.processWebhookEvent(payload);

    expect(fetchMock).toHaveBeenCalledWith(mockWebhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      body: jsonStringifiedPayload,
    });
  });

    it('should handle missing secret', async () => {
      const payload: WebhookPayload = {
        event: 'issue.created',
        data: { issueId: 'issue-1' },
      };

      const webhookWithoutSecret = {
        ...mockWebhook,
        secret: null,
      };

      const jsonStringifiedPayload = JSON.stringify(payload);

      (mockDB.all as any).mockReturnValue([
        {
          id: webhookWithoutSecret.id,
          url: webhookWithoutSecret.url,
          events: JSON.stringify(webhookWithoutSecret.events),
          secret: null,
          active: webhookWithoutSecret.active ? 1 : 0,
        },
      ]);
      const fetchMock = vi.spyOn(global, 'fetch');

      await service.processWebhookEvent(payload);

      expect(fetchMock).toHaveBeenCalledWith(mockWebhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonStringifiedPayload,
      });
    });
});
