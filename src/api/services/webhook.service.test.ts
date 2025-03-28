// src/api/services/webhook.service.test.ts
import { mocked } from 'ts-jest/utils';
import { handleWebhookEvent, WebhookService } from './webhook.service';
import { WebhookEvent, WebhookPayload } from '../types/webhook.d';
import Database from '../../src/db/database';

jest.mock('../../src/db/database');
const mockDatabase = mocked(Database, true);

describe('Webhook Service', () => {
  let webhookService: WebhookService;
  let mockDbInstance: any;

  beforeEach(() => {
    mockDbInstance = {
      run: jest.fn(),
      all: jest.fn(),
      get: jest.fn(),
    };
    mockDatabase.mockImplementation(() => mockDbInstance);
    webhookService = new WebhookService(new mockDatabase());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process a valid webhook event and invoke webhook', async () => {
    const mockEvent: WebhookPayload = {
      event: 'issue.created',
      data: {
        issue: {
          key: 'ATM-123',
          summary: 'Test Issue',
        },
      },
    };

    const mockWebhook = {
      id: 'webhook-id',
      url: 'http://example.com/webhook',
      events: ['issue.created'],
      secret: 'secret',
      active: true,
    };

    mockDbInstance.all.mockResolvedValue([mockWebhook]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await webhookService.processWebhookEvent(mockEvent);

    expect(mockDbInstance.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ["%issue.created%"]);
    expect(global.fetch).toHaveBeenCalledWith('http://example.com/webhook', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(mockEvent),
    }));
  });

  it('should not invoke webhook if event does not match', async () => {
    const mockEvent: WebhookPayload = {
      event: 'issue.updated',
      data: {
        issue: {
          key: 'ATM-123',
          summary: 'Test Issue',
        },
      },
    };

    const mockWebhook = {
      id: 'webhook-id',
      url: 'http://example.com/webhook',
      events: ['issue.created'],
      secret: 'secret',
      active: true,
    };

    mockDbInstance.all.mockResolvedValue([mockWebhook]);
    global.fetch = jest.fn();

    await webhookService.processWebhookEvent(mockEvent);

    expect(mockDbInstance.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ["%issue.updated%"]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle errors during webhook processing', async () => {
    const mockEvent: WebhookPayload = {
      event: 'issue.created',
      data: {
        issue: {
          key: 'ATM-123',
          summary: 'Test Issue',
        },
      },
    };

    mockDbInstance.all.mockRejectedValue(new Error('Database error'));

    await expect(webhookService.processWebhookEvent(mockEvent)).rejects.toThrow('Failed to process webhook event: Database error');
    expect(mockDbInstance.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', ["%issue.created%"]);
  });

  it('should handle webhook invocation failure', async () => {
      const mockEvent: WebhookPayload = {
        event: 'issue.created',
        data: {
          issue: {
            key: 'ATM-123',
            summary: 'Test Issue',
          },
        },
      };

      const mockWebhook = {
        id: 'webhook-id',
        url: 'http://example.com/webhook',
        events: ['issue.created'],
        secret: 'secret',
        active: true,
      };

      mockDbInstance.all.mockResolvedValue([mockWebhook]);
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      await webhookService.processWebhookEvent(mockEvent);

      expect(global.fetch).toHaveBeenCalledWith('http://example.com/webhook', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockEvent),
      }));
  });
  
  it('should generate signature correctly', () => {
      const data = '{"event":"issue.created","data":{"issue":{"key":"ATM-123","summary":"Test Issue"}}}';
      const secret = 'secret';
      const expectedSignature = '85059c780e015f121b93200d769348e697882ba2f68435609a30a66b6455856d';
      const service = new WebhookService(new mockDatabase());
      const signature = service.generateSignature(data, secret);
      expect(signature).toBe(expectedSignature);
  });
});
