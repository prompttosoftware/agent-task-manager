import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWebhook, deleteWebhook, getAllWebhooks } from './webhook.service';
import * as db from '../../src/db/database';
import { Webhook } from '../types/webhook.d';

vi.mock('../../src/db/database');

describe('Webhook Service', () => {
  const mockWebhook: Webhook = {
    id: '1',
    url: 'https://example.com/webhook',
    events: ['issue.created'],
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a webhook', async () => {
    (db.insert as any).mockResolvedValue(1);

    const result = await createWebhook(mockWebhook);

    expect(result).toEqual(1);
    expect(db.insert).toHaveBeenCalledWith('webhooks', expect.objectContaining({ url: mockWebhook.url, events: mockWebhook.events, isActive: mockWebhook.isActive }));
  });

  it('should get all webhooks', async () => {
    const mockWebhooks: Webhook[] = [mockWebhook];
    (db.getAll as any).mockResolvedValue(mockWebhooks);

    const result = await getAllWebhooks();

    expect(result).toEqual(mockWebhooks);
    expect(db.getAll).toHaveBeenCalledWith('webhooks');
  });

  it('should delete a webhook', async () => {
    (db.remove as any).mockResolvedValue(1);

    const result = await deleteWebhook('1');

    expect(result).toEqual(1);
    expect(db.remove).toHaveBeenCalledWith('webhooks', 'id', '1');
  });

  it('should handle errors when creating a webhook', async () => {
    (db.insert as any).mockRejectedValue(new Error('Database error'));

    await expect(createWebhook(mockWebhook)).rejects.toThrow('Database error');
  });

  it('should handle errors when getting all webhooks', async () => {
    (db.getAll as any).mockRejectedValue(new Error('Database error'));

    await expect(getAllWebhooks()).rejects.toThrow('Database error');
  });

  it('should handle errors when deleting a webhook', async () => {
    (db.remove as any).mockRejectedValue(new Error('Database error'));

    await expect(deleteWebhook('1')).rejects.toThrow('Database error');
  });
});
