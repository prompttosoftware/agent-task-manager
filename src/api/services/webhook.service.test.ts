import { sendToExternalService, enqueueWebhook, processWebhook, getDeadLetterQueue, getWebhookQueueSize } from './webhook.service';
import { WebhookPayload } from '../../types/webhook';
import { RegisterWebhookRequest } from './webhook.service';
import logger from '../../utils/logger';
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
    expect(getWebhookQueueSize()).toBe(1); // Assuming this function increments some internal queue.
  });

  it('should process a webhook payload by calling sendToExternalService', async () => {
    const webhookUrl = 'http://example.com/webhook';
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    // Mock enqueueWebhook to avoid side effects in other tests
    const enqueueWebhookMock = jest.spyOn(webhookService, 'enqueueWebhook');
    enqueueWebhookMock.mockImplementation(() => {});

    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 } as Response);

    await processWebhook(webhookUrl, payload);  // Pass the payload

    expect(fetch).toHaveBeenCalledWith(webhookUrl, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload)  //Verify payload is being passed
    }));

     enqueueWebhookMock.mockRestore();
  });

  it('should handle errors when sending to external service and add to dead letter queue', async () => {
    const webhookUrl = 'http://example.com/webhook';
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
     // Mock enqueueWebhook to avoid side effects in other tests
    const enqueueWebhookMock = jest.spyOn(webhookService, 'enqueueWebhook');
    enqueueWebhookMock.mockImplementation(() => {});
    const getDeadLetterQueueMock = jest.spyOn(webhookService, 'getDeadLetterQueue');
    const deadLetterQueue: any[] = [];
    getDeadLetterQueueMock.mockImplementation(() => deadLetterQueue);

    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response);

    await processWebhook(webhookUrl, payload);

    expect(deadLetterQueue.length).toBe(1);
    expect(deadLetterQueue[0]).toEqual({ webhookUrl, payload });

     enqueueWebhookMock.mockRestore();
     getDeadLetterQueueMock.mockRestore();
  });

  it('should retry sending webhook on network errors and eventually add to dead letter queue', async () => {
    const webhookUrl = 'http://example.com/webhook';
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };

     // Mock enqueueWebhook to avoid side effects in other tests
    const enqueueWebhookMock = jest.spyOn(webhookService, 'enqueueWebhook');
    enqueueWebhookMock.mockImplementation(() => {});

    const getDeadLetterQueueMock = jest.spyOn(webhookService, 'getDeadLetterQueue');
    const deadLetterQueue: any[] = [];
    getDeadLetterQueueMock.mockImplementation(() => deadLetterQueue);

    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await processWebhook(webhookUrl, payload);
    expect(fetch).toHaveBeenCalledTimes(4); // 3 retries + 1 initial attempt
    expect(deadLetterQueue.length).toBe(1);
    expect(deadLetterQueue[0]).toEqual({ webhookUrl, payload });

     enqueueWebhookMock.mockRestore();
     getDeadLetterQueueMock.mockRestore();
  });
});