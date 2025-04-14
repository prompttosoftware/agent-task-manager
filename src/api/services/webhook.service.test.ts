// src/api/services/webhook.service.test.ts
import { sendToExternalService, getDeadLetterQueue, enqueueWebhook, processWebhook, getWebhookQueueSize } from './webhook.service';
import { WebhookPayload } from '../types/webhook';
import fetch, { FetchError } from 'node-fetch';
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
    const dlq = getDeadLetterQueue();
    while (dlq.length > 0) {
      dlq.pop();
    }

    // Clear the webhook queue by processing all items
    while (getWebhookQueueSize() > 0) {
      processWebhook(webhookUrl);
    }
    jest.useFakeTimers(); // Enable fake timers for rate limit testing
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers after each test
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
    mockedFetch.mockResolvedValue({
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
    mockedFetch.mockRejectedValue(new FetchError('Network error', ''));


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

    const webhookUrl = 'https://example.com/webhook';
    const payload: WebhookPayload = { data: { message: 'test' } };
    // Mock fetch to be successful

    mockedFetch.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' } as any);

    // First 10 requests should succeed instantly
    for (let i = 0; i < 10; i++) {
      await sendToExternalService(payload, webhookUrl);
    }
    expect(mockedFetch).toHaveBeenCalledTimes(10);

    // Advance time to allow tokens to refill.  Sufficient tokens should be available after 10 seconds.
    jest.advanceTimersByTime(10000);
    // 11th request should succeed after waiting.
    await sendToExternalService(payload, webhookUrl);
    expect(mockedFetch).toHaveBeenCalledTimes(11);

    //Fast forward time to trigger rate limit
    jest.advanceTimersByTime(10);
    // 12th request should be rate limited.
    mockedLogger.warn.mockClear()
    await sendToExternalService(payload, webhookUrl);
    expect(mockedLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Rate limit exceeded for'));
    expect(mockedFetch).toHaveBeenCalledTimes(12);
  });

  it('enqueueWebhook should add a webhook to the queue', () => {
    enqueueWebhook(payload);
    expect(getWebhookQueueSize()).toBe(1);
  });

  it('getWebhookQueueSize should return the correct queue size', () => {
    enqueueWebhook(payload);
    enqueueWebhook(payload);
    expect(getWebhookQueueSize()).toBe(2);
  });

  it('should add to DLQ after exceeding rate limit', async () => {
        mockedFetch.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' } as any);

        // Send the maximum allowed requests to consume all tokens
        for (let i = 0; i < 10; i++) {
            await sendToExternalService(payload, webhookUrl);
        }

        // Attempt to send one more request, which should exceed the rate limit
        await sendToExternalService(payload, webhookUrl);

        // Assert that the rate limit was exceeded
        expect(mockedLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Rate limit exceeded for'));

        // Fast forward enough time for the retries with rate limit to complete and add to DLQ
        jest.advanceTimersByTime(3000);

        // Assert that the webhook was added to the dead letter queue due to rate limiting
        expect(getDeadLetterQueue().length).toBe(1);
        expect(getDeadLetterQueue()[0].reason).toBe('Rate limit exceeded');
    });
});
