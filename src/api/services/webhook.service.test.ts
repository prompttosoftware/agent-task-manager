import { WebhookService, sendToExternalService, enqueueWebhook, processWebhook, getDeadLetterQueue, getWebhookQueueSize } from './webhook.service';
import { RegisterWebhookRequest, WebhookPayload } from '../types/webhook';
import logger from '../utils/logger';
import fetch, { Response } from 'node-fetch';

jest.mock('node-fetch');

describe('WebhookService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should enqueue a webhook payload', () => {
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    enqueueWebhook(payload);
    expect(getWebhookQueueSize()).toBe(1);
  });

  it('should process a webhook payload by calling sendToExternalService', async () => {
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    const webhookUrl = 'http://example.com/webhook';
    enqueueWebhook(payload);

    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 } as Response);

    await processWebhook(webhookUrl);
    expect(fetch).toHaveBeenCalledWith(webhookUrl, expect.objectContaining({ method: 'POST' }));
  });

  it('should handle errors when sending to external service', async () => {
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    const webhookUrl = 'http://example.com/webhook';
    enqueueWebhook(payload);

    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response);

    await processWebhook(webhookUrl);
    expect(getDeadLetterQueue().length).toBeGreaterThan(0);
  });

  it('should retry sending webhook on network errors', async () => {
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    const webhookUrl = 'http://example.com/webhook';
    enqueueWebhook(payload);

    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await processWebhook(webhookUrl);
    expect(fetch).toHaveBeenCalledTimes(4); // 3 retries + 1 initial attempt
    expect(getDeadLetterQueue().length).toBeGreaterThan(0);
  });
});