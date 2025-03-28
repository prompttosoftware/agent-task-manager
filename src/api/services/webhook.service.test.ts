// src/api/services/webhook.service.test.ts
import { test, describe, expect, beforeEach, vi } from 'vitest';
import * as webhookService from './webhook.service';
import { getDB } from '../db/database';

vi.mock('../db/database');

describe('Webhook Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      const mockRun = vi.fn().mockReturnValue({ lastID: 1 });
      (getDB as jest.Mock).mockReturnValue({ prepare: () => ({ run: mockRun }) } as any);

      const result = await webhookService.createWebhook('https://example.com');

      expect(result).toEqual({ id: '1', url: 'https://example.com' });
      expect(mockRun).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (getDB as jest.Mock).mockReturnValue({ prepare: () => ({ run: vi.fn().mockImplementation(() => { throw new Error('DB Error') }) }) } as any);

      await expect(webhookService.createWebhook('https://example.com')).rejects.toThrow('DB Error');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 1 });
      (getDB as jest.Mock).mockReturnValue({ prepare: () => ({ run: mockRun }) } as any);

      const result = await webhookService.deleteWebhook('123');

      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      (getDB as jest.Mock).mockReturnValue({ prepare: () => ({ run: vi.fn().mockImplementation(() => { throw new Error('DB Error') }) }) } as any);

      await expect(webhookService.deleteWebhook('123')).rejects.toThrow('DB Error');
    });
  });

  describe('getAllWebhooks', () => {
    it('should get all webhooks successfully', async () => {
      const mockAll = vi.fn().mockReturnValue([{ id: 1, url: 'https://example.com' }]);
      (getDB as jest.Mock).mockReturnValue({ prepare: () => ({ all: mockAll }) } as any);

      const result = await webhookService.getAllWebhooks();

      expect(result).toEqual([{ id: '1', url: 'https://example.com' }]);
      expect(mockAll).toHaveBeenCalled();
    });

    it('should handle database errors during get all', async () => {
      (getDB as jest.Mock).mockReturnValue({ prepare: () => ({ all: vi.fn().mockImplementation(() => { throw new Error('DB Error') }) }) } as any);

      await expect(webhookService.getAllWebhooks()).rejects.toThrow('DB Error');
    });
  });
});