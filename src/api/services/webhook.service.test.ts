import { WebhookService } from './webhook.service';
import { Database } from '../../src/db/database';
import { WebhookRegisterRequest, WebhookDeleteResponse, WebhookListResponse, WebhookStatus } from '../types/webhook.d';

// Mock the database
jest.mock('../../src/db/database');
const mockDb = {
  run: jest.fn(),
  all: jest.fn(),
};

// Helper function to create a WebhookService instance
const createService = () => {
  // @ts-ignore  Ignore type checking for mocking purposes
  return new WebhookService(mockDb as unknown as Database);
};

describe('WebhookService', () => {
  beforeEach(() => {
    // Reset mock state before each test
    jest.clearAllMocks();
  });

  describe('registerWebhook', () => {
    it('should register a webhook successfully', async () => {
      const request: WebhookRegisterRequest = {
        callbackUrl: 'https://example.com/webhook',
        events: ['issue.created'],
      };
      const mockId = 'webhook-id-123';
      // Mock the crypto.randomUUID function to return a known ID
      jest.spyOn(global.crypto, 'randomUUID').mockReturnValue(mockId);

      mockDb.run.mockResolvedValue({ changes: 1 }); // Simulate successful insert

      const service = createService();
      const response = await service.registerWebhook(request);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO webhooks'),
        expect.arrayContaining([mockId, request.callbackUrl, expect.any(String), JSON.stringify(request.events), WebhookStatus.ACTIVE, expect.any(String), expect.any(String)])
      );
      expect(response.id).toBe(mockId);
      expect(response.callbackUrl).toBe(request.callbackUrl);
      expect(response.events).toEqual(request.events);
      expect(response.status).toBe(WebhookStatus.ACTIVE);
    });

    it('should throw an error if registration fails', async () => {
      const request: WebhookRegisterRequest = {
        callbackUrl: 'https://example.com/webhook',
        events: ['issue.created'],
      };
      mockDb.run.mockRejectedValue(new Error('Database error'));

      const service = createService();
      await expect(service.registerWebhook(request)).rejects.toThrow('Failed to register webhook: Database error');
      expect(mockDb.run).toHaveBeenCalled();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      const webhookId = 'webhook-id-123';
      mockDb.run.mockResolvedValue({ changes: 1 }); // Simulate successful update

      const service = createService();
      const response = await service.deleteWebhook(webhookId);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE webhooks SET status = ?, updatedAt = ? WHERE id = ?'),
        expect.arrayContaining([WebhookStatus.DELETED, expect.any(String), webhookId])
      );
      expect(response.id).toBe(webhookId);
      expect(response.status).toBe(WebhookStatus.DELETED);
    });

    it('should throw an error if webhook is not found', async () => {
      const webhookId = 'webhook-id-123';
      mockDb.run.mockResolvedValue({ changes: 0 }); // Simulate no rows updated

      const service = createService();
      await expect(service.deleteWebhook(webhookId)).rejects.toThrow('Webhook with id webhook-id-123 not found');
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should throw an error if deletion fails', async () => {
      const webhookId = 'webhook-id-123';
      mockDb.run.mockRejectedValue(new Error('Database error'));

      const service = createService();
      await expect(service.deleteWebhook(webhookId)).rejects.toThrow('Failed to delete webhook: Database error');
      expect(mockDb.run).toHaveBeenCalled();
    });
  });

  describe('listWebhooks', () => {
    it('should list webhooks successfully', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-id-123',
          callbackUrl: 'https://example.com/webhook',
          secret: 'secret123',
          events: ['issue.created'],
          status: WebhookStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockDb.all.mockResolvedValue(
        mockWebhooks.map(webhook => ({
          ...webhook,
          events: JSON.stringify(webhook.events),
        }))
      );

      const service = createService();
      const response = await service.listWebhooks();

      expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('SELECT id, callbackUrl, secret, events, status, createdAt, updatedAt FROM webhooks WHERE status != ?'), [WebhookStatus.DELETED]);
      expect(response.webhooks).toEqual(expect.arrayContaining([{
        ...mockWebhooks[0],
        events: mockWebhooks[0].events
      }]));
    });

    it('should return an empty list if no webhooks are found', async () => {
      mockDb.all.mockResolvedValue([]);

      const service = createService();
      const response = await service.listWebhooks();

      expect(response.webhooks).toEqual([]);
    });

    it('should throw an error if listing fails', async () => {
      mockDb.all.mockRejectedValue(new Error('Database error'));

      const service = createService();
      await expect(service.listWebhooks()).rejects.toThrow('Failed to list webhooks: Database error');
      expect(mockDb.all).toHaveBeenCalled();
    });
  });
});
