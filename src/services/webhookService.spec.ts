// src/services/webhookService.spec.ts
import { triggerWebhooks, createWebhook, deleteWebhook } from './webhookService';
import axios from 'axios';
import { getDBConnection } from '../config/db';

jest.mock('axios');
jest.mock('../config/db');

describe('webhookService', () => {
  const mockAxios = axios as jest.Mocked<typeof axios>;
  const mockGetDBConnection = getDBConnection as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerWebhooks', () => {
    it('should send webhooks for matching event types', async () => {
      const eventType = 'issue.created';
      const issueData = { id: 1, title: 'Test Issue' };
      const webhooks = [
        { id: 1, url: 'http://example.com/webhook1', events: 'issue.created,issue.updated' },
        { id: 2, url: 'http://example.com/webhook2', events: 'issue.deleted' },
      ];

      mockGetDBConnection.mockResolvedValue({all: jest.fn().mockImplementation((sql, params, callback) => callback(null, [webhooks[0]] ))});
      mockAxios.post.mockResolvedValue({ status: 200 });

      await triggerWebhooks(eventType, issueData);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://example.com/webhook1', 
        expect.objectContaining({ webhookEvent: eventType, issue: issueData }),
        expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
      );
    });

    it('should handle errors when sending webhooks', async () => {
        const eventType = 'issue.created';
        const issueData = { id: 1, title: 'Test Issue' };
        const webhooks = [
          { id: 1, url: 'http://example.com/webhook1', events: 'issue.created,issue.updated' },
        ];
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
        mockGetDBConnection.mockResolvedValue({all: jest.fn().mockImplementation((sql, params, callback) => callback(null, [webhooks[0]] ))});
        mockAxios.post.mockRejectedValue(new Error('Network Error'));
    
        await triggerWebhooks(eventType, issueData);
    
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });

    it('should handle errors when querying webhooks', async () => {
      const eventType = 'issue.created';
      const issueData = { id: 1, title: 'Test Issue' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockGetDBConnection.mockResolvedValue({all: jest.fn().mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null))});

      await triggerWebhooks(eventType, issueData);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createWebhook', () => {
    it('should create a new webhook', async () => {
      const webhookData = { url: 'http://example.com/new', events: 'issue.created' };
      const mockRun = jest.fn().mockImplementation((sql, params, callback) => callback(null, { lastID: 1 }));
      mockGetDBConnection.mockResolvedValue({run: mockRun});

      const result = await createWebhook(webhookData);

      expect(mockRun).toHaveBeenCalledWith(expect.any(String), [webhookData.url, webhookData.events], expect.any(Function));
      expect(result).toEqual({ id: 1, url: webhookData.url, events: webhookData.events });
    });

    it('should handle errors when creating webhook', async () => {
        const webhookData = { url: 'http://example.com/new', events: 'issue.created' };
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockGetDBConnection.mockResolvedValue({run: jest.fn().mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null))});
    
        await expect(createWebhook(webhookData)).rejects.toThrow('DB Error');
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook', async () => {
      const webhookId = '1';
      const mockRun = jest.fn().mockImplementation((sql, params, callback) => callback(null));
      mockGetDBConnection.mockResolvedValue({run: mockRun});

      await deleteWebhook(webhookId);

      expect(mockRun).toHaveBeenCalledWith(expect.any(String), [webhookId], expect.any(Function));
    });

    it('should handle errors when deleting webhook', async () => {
        const webhookId = '1';
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockGetDBConnection.mockResolvedValue({run: jest.fn().mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null))});
    
        await expect(deleteWebhook(webhookId)).rejects.toThrow('DB Error');
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
  });
});
