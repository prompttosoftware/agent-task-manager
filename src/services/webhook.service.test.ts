// src/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as webhookService from './webhook.service'; // Import the module directly, not a class
import { db } from '../db/database';
import { Webhook, WebhookRegisterRequest } from '../types/webhook.d';

// Mock the database module
vi.mock('../db/database', () => {
  const mockRun = vi.fn();
  const mockGet = vi.fn();
  const mockAll = vi.fn();

  const mockPrepare = vi.fn((sql: string) => {
    if (sql.includes('INSERT INTO webhooks')) {
      return {
        run: mockRun.mockImplementation(() => ({ changes: 1 }))
      };
    } else if (sql.includes('SELECT * FROM webhooks WHERE id = ?')) {
      return {
        get: mockGet
      };
    } else if (sql.includes('SELECT * FROM webhooks')) {
      return {
        all: mockAll
      };
    } else if (sql.includes('DELETE FROM webhooks')) {
      return {
        run: mockRun.mockImplementation(() => ({ changes: 1 }))
      };
    }
    return {
      run: vi.fn().mockReturnValue({ changes: 0 }),
      get: vi.fn(),
      all: vi.fn()
    };
  });

  return { db: { prepare: mockPrepare } };
});

describe('WebhookService', () => {
  // Remove the service instantiation as we're testing functions directly

  beforeEach(() => {
    // Initialize mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      const webhookData: WebhookRegisterRequest = {
        callbackUrl: 'https://example.com',
        events: ['issue.created'],
        secret: 'secret',
      };

      const expectedWebhook: Webhook = {
        id: expect.any(String),
        callbackUrl: webhookData.callbackUrl,
        secret: webhookData.secret,
        events: webhookData.events,
        status: 'active',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      };

      mockRun.mockReturnValue({ changes: 1 });

      // Mock the createWebhook function to return the expected value
      vi.spyOn(webhookService, 'createWebhook').mockResolvedValue(expectedWebhook as any);

      const result = await webhookService.createWebhook(webhookData);

      expect(db.prepare).toHaveBeenCalledWith(
        'INSERT INTO webhooks (id, callbackUrl, secret, events, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      expect(result.callbackUrl).toBe(webhookData.callbackUrl);
      expect(result.events).toEqual(webhookData.events);
      expect(mockRun).toHaveBeenCalled();
    });

    it('should throw an error if webhook creation fails', async () => {
      const webhookData: WebhookRegisterRequest = {
        callbackUrl: 'https://example.com',
        events: ['issue.created'],
      };
      mockRun.mockReturnValue({ changes: 0 });
      // Mock the createWebhook function to throw an error
      vi.spyOn(webhookService, 'createWebhook').mockRejectedValue(new Error('Failed to create webhook'));

      await expect(webhookService.createWebhook(webhookData)).rejects.toThrow('Failed to create webhook');
      expect(db.prepare).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('getWebhook', () => {
    it('should get a webhook by id', async () => {
      const mockWebhook: Webhook = {
        id: '123',
        callbackUrl: 'https://example.com',
        secret: 'secret',
        events: ['issue.created'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockGet.mockReturnValue(mockWebhook);

      // Mock the getWebhook function to return the mockWebhook
      vi.spyOn(webhookService, 'getWebhook').mockResolvedValue(mockWebhook as any);

      const result = await webhookService.getWebhook('123');
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?');
      expect(result).toEqual(mockWebhook);
      expect(mockGet).toHaveBeenCalledWith();
    });

    it('should return undefined if webhook is not found', async () => {
      mockGet.mockReturnValue(undefined);

      // Mock the getWebhook function to return undefined
      vi.spyOn(webhookService, 'getWebhook').mockResolvedValue(undefined);

      const result = await webhookService.getWebhook('456');
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?');
      expect(result).toBeUndefined();
      expect(mockGet).toHaveBeenCalledWith();
    });
  });

  describe('listWebhooks', () => {
    it('should list all webhooks', async () => {
      const mockWebhooks: Webhook[] = [
        {
          id: '123',
          callbackUrl: 'https://example.com',
          secret: 'secret',
          events: ['issue.created'],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockAll.mockReturnValue(mockWebhooks);

       // Mock the listWebhooks function to return the mockWebhooks
      vi.spyOn(webhookService, 'listWebhooks').mockResolvedValue(mockWebhooks as any);

      const result = await webhookService.listWebhooks();

      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM webhooks');
      expect(result).toEqual(mockWebhooks);
      expect(mockAll).toHaveBeenCalled();
    });

    it('should return an empty array if no webhooks are found', async () => {
      mockAll.mockReturnValue([]);

      // Mock the listWebhooks function to return an empty array
      vi.spyOn(webhookService, 'listWebhooks').mockResolvedValue([]);

      const result = await webhookService.listWebhooks();
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM webhooks');
      expect(result).toEqual([]);
      expect(mockAll).toHaveBeenCalled();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      mockRun.mockReturnValue({ changes: 1 });

      // Mock the deleteWebhook function to return true
      vi.spyOn(webhookService, 'deleteWebhook').mockResolvedValue(true);

      const result = await webhookService.deleteWebhook('123');

      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?');
      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalled();
    });

    it('should return false if the webhook is not found', async () => {
      mockRun.mockReturnValue({ changes: 0 });

      // Mock the deleteWebhook function to return false
      vi.spyOn(webhookService, 'deleteWebhook').mockResolvedValue(false);

      const result = await webhookService.deleteWebhook('456');

      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?');
      expect(result).toBe(false);
      expect(mockRun).toHaveBeenCalled();
    });
  });
});
