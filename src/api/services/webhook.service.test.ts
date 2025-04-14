// src/api/services/webhook.service.test.ts
import { sendToExternalService, getDeadLetterQueue, enqueueWebhook, processWebhook, getWebhookQueueSize } from './webhook.service';
import { WebhookPayload } from '../types/webhook';
import fetch from 'node-fetch';
import { logger } from '../utils/logger';

jest.mock('node-fetch');
jest.mock('../utils/logger');

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

describe('Webhook Service', () => {
  const webhookUrl = 'https://example.com/webhook';
  const payload: WebhookPayload = { data: { message: 'test' } };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the DLQ and queue before each test
    while (getDeadLetterQueue().length) {
      getDeadLetterQueue().pop();
    }
    while (getWebhookQueueSize() > 0) {
      // Assuming you have a way to clear the queue, or that dequeueing handles it
      // For example, if the queue is an in-memory array:
      processWebhook(webhookUrl);
    }

  });

  it('should successfully send the webhook if the external service returns 200', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as any);

    await sendToExternalService(payload, webhookUrl);

    expect(mockedFetch).toHaveBeenCalledWith(webhookUrl, expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 5000,
    }));
    expect(mockedLogger.info).toHaveBeenCalledWith(`Webhook sent successfully to ${webhookUrl}`);
    expect(getDeadLetterQueue().length).toBe(0);
  });

  it('should retry if the external service returns a 500 error up to 3 times', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as any);

    await sendToExternalService(payload, webhookUrl);

    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(mockedLogger.warn).toHaveBeenCalledWith(`Webhook to ${webhookUrl} failed with status 500: Internal Server Error`);
    expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining('Retrying in 1000ms...'));
    expect(mockedLogger.info).toHaveBeenCalledWith(`Webhook sent successfully to ${webhookUrl}`);
    expect(getDeadLetterQueue().length).toBe(0);
  });

  it('should add to DLQ if the external service returns a 400 error', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as any);

    await sendToExternalService(payload, webhookUrl);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedLogger.warn).toHaveBeenCalledWith(`Webhook to ${webhookUrl} failed with status 400: Bad Request`);
    expect(getDeadLetterQueue().length).toBe(1);
    expect(getDeadLetterQueue()[0].reason).toBe('Client error');
  });

  it('should add to DLQ after max retries on a 500 error', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);
    mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

    await sendToExternalService(payload, webhookUrl);

    expect(mockedFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(mockedLogger.warn).toHaveBeenCalledWith(`Webhook to ${webhookUrl} failed with status 500: Internal Server Error`);
    expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining('Retrying in 1000ms...'));
    expect(getDeadLetterQueue().length).toBe(1);
    expect(getDeadLetterQueue()[0].reason).toBe('Max retries exceeded');
  });

  it('should handle fetch errors and add to DLQ after retries', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));

    await sendToExternalService(payload, webhookUrl);

    expect(mockedFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(mockedLogger.error).toHaveBeenCalledWith(expect.stringContaining('Network error sending webhook to'));
    expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining('Retrying in 1000ms...'));
    expect(getDeadLetterQueue().length).toBe(1);
    expect(getDeadLetterQueue()[0].reason).toBe('Max retries exceeded or network error');
    expect(getDeadLetterQueue()[0].error).toBe('Network error');
  });

  it('should process webhooks from the queue', async () => {
    const testWebhookUrl = 'https://test.com/webhook';
    const testPayload: WebhookPayload = { data: { test: 'data' } };

    // Mock successful fetch
    mockedFetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as any);

    // Enqueue a webhook
    enqueueWebhook(testPayload);

    // Process the webhook
    await processWebhook(testWebhookUrl);

    // Assertions
    expect(mockedFetch).toHaveBeenCalledWith(testWebhookUrl, expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
      timeout: 5000,
    }));
    expect(mockedLogger.info).toHaveBeenCalledWith('Processing webhook:', testPayload);
    expect(mockedLogger.info).toHaveBeenCalledWith('Webhook sent successfully to https://test.com/webhook');
    expect(getWebhookQueueSize()).toBe(0);
    expect(getDeadLetterQueue().length).toBe(0);

  });

  it('should handle errors during webhook processing in processWebhook', async () => {
    const testWebhookUrl = 'https://test.com/webhook';
    const testPayload: WebhookPayload = { data: { test: 'data' } };
    // Mock fetch to reject
    mockedFetch.mockRejectedValueOnce(new Error('Simulated processing error'));

    // Enqueue a webhook
    enqueueWebhook(testPayload);

    // Process the webhook
    await processWebhook(testWebhookUrl);
    expect(mockedLogger.error).toHaveBeenCalledWith('Error in processWebhook:', expect.any(Error));
  });

  it('should rate limit requests', async () => {
    // Fast forward time to avoid rate limiting issues from the start
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 1, 0, 0, 0)); // January 1, 2024 00:00:00
    const webhookUrl = 'https://example.com/webhook';
    const payload: WebhookPayload = { data: { message: 'test' } };
    // Mock fetch to be successful
    mockedFetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as any);
    // First 10 requests should succeed instantly
    for (let i = 0; i < 10; i++) {
      await sendToExternalService(payload, webhookUrl);
    }

    // 11th request should be rate limited
    mockedFetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as any);
    await sendToExternalService(payload, webhookUrl);

    expect(mockedFetch).toHaveBeenCalledTimes(11);
    expect(mockedLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Rate limit exceeded for'));
    jest.useRealTimers();
  });
});