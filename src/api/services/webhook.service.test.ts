// src/api/services/webhook.service.test.ts
import { test, expect, describe, beforeEach, vi } from 'vitest';
import { createWebhook, deleteWebhook, getAllWebhooks } from './webhook.service';
import * as db from '../db/database';

describe('Webhook Service', () => {
  const mockWebhook = { id: '123', url: 'https://example.com' };
  const mockDb = {
    run: vi.fn(),
    get: vi.fn(),
    all: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, 'getDB').mockReturnValue(mockDb as any);
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      mockDb.run.mockReturnValue({ lastID: '123' });
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      const result = await createWebhook('https://example.com');
      expect(result).toEqual({ id: '123', url: 'https://example.com' });
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should throw an error if database operation fails', async () => {
      mockDb.run.mockImplementation(() => {
        throw new Error('Database error');
      });
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      await expect(createWebhook('https://example.com')).rejects.toThrow('Database error');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      mockDb.run.mockReturnValue({ changes: 1 });
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      const result = await deleteWebhook('123');
      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should return false if webhook is not found', async () => {
      mockDb.run.mockReturnValue({ changes: 0 });
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      const result = await deleteWebhook('456');
      expect(result).toBe(false);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should throw an error if database operation fails', async () => {
      mockDb.run.mockImplementation(() => {
        throw new Error('Database error');
      });
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      await expect(deleteWebhook('123')).rejects.toThrow('Database error');
    });
  });

  describe('getAllWebhooks', () => {
    it('should retrieve all webhooks successfully', async () => {
      mockDb.all.mockReturnValue([mockWebhook]);
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      const result = await getAllWebhooks();
      expect(result).toEqual([mockWebhook]);
      expect(mockDb.all).toHaveBeenCalled();
    });

    it('should return an empty array if no webhooks are found', async () => {
      mockDb.all.mockReturnValue([]);
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      const result = await getAllWebhooks();
      expect(result).toEqual([]);
      expect(mockDb.all).toHaveBeenCalled();
    });

    it('should throw an error if database operation fails', async () => {
      mockDb.all.mockImplementation(() => {
        throw new Error('Database error');
      });
      (db.getDB().prepare as any) = vi.fn().mockReturnValue(mockDb);
      await expect(getAllWebhooks()).rejects.toThrow('Database error');
    });
  });
});
