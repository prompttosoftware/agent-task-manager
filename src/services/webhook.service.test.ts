import { Webhook } from '../types/webhook';
import { WebhookService } from './webhook.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookService', () => {
  jest.useFakeTimers();

  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.resetAllMocks();
  });

  it('constructor calls startQueueProcessing', () => {
    const startQueueProcessingSpy = jest.spyOn(
      WebhookService.prototype as any,
      'startQueueProcessing'
    );
    new WebhookService();
    expect(startQueueProcessingSpy).toHaveBeenCalled();
  });

  it('enqueueWebhook correctly adds webhooks to the queue', () => {
    const webhook: Webhook = {
      url: 'http://example.com/webhook',
      payload: { data: 'test' },
    };
    webhookService.enqueueWebhook(webhook);
    expect((webhookService as any).queue).toEqual([webhook]);
  });

  it('processQueue processes webhooks, calls deliverWebhook, and removes them from the queue', async () => {
    const webhook: Webhook = {
      url: 'http://example.com/webhook',
      payload: { data: 'test' },
    };
    webhookService.enqueueWebhook(webhook);
    const deliverWebhookSpy = jest.spyOn(
      webhookService, // Corrected: Use the instance
      'deliverWebhook'
    ).mockImplementation(async () => {}); // Mock the implementation

    mockedAxios.post.mockResolvedValue({ data: 'success' });

    await (webhookService as any).processQueue();

    expect(deliverWebhookSpy).toHaveBeenCalledWith(webhook);
    expect((webhookService as any).queue).toEqual([]);
  });

  it('deliverWebhook successfully calls axios.post with the correct parameters', async () => {
    const webhook: Webhook = {
      url: 'http://example.com/webhook',
      payload: { data: 'test' },
    };

    mockedAxios.post.mockResolvedValue({ data: 'success' });

    await (webhookService as any).deliverWebhook(webhook);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      webhook.url,
      webhook.payload
    );
  });

  it('deliverWebhook handles errors from axios.post', async () => {
    const webhook: Webhook = {
      url: 'http://example.com/webhook',
      payload: { data: 'test' },
    };

    mockedAxios.post.mockRejectedValue(new Error('Request failed'));

    await expect((webhookService as any).deliverWebhook(webhook)).rejects.toThrow('Request failed');
  });

  it('processQueue handles retries on failure', async () => {
    const webhook: Webhook = {
      url: 'http://example.com/webhook',
      payload: { data: 'test' },
    };
    webhookService.enqueueWebhook(webhook);

    mockedAxios.post.mockRejectedValue(new Error('Request failed'));

    await (webhookService as any).processQueue();
    expect((webhookService as any).queue[0].retryCount).toBe(1);
  });

  it('processQueue stops retrying after the maximum number of retries', async () => {
    const webhook: Webhook = {
      url: 'http://example.com/webhook',
      payload: { data: 'test' },
      retryCount: 2, // Assuming maxRetries is 3
    };
    webhookService.enqueueWebhook(webhook);

    mockedAxios.post.mockRejectedValue(new Error('Request failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await (webhookService as any).processQueue();

    expect((webhookService as any).queue).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('startQueueProcessing sets up the interval correctly', () => {
    const processQueueSpy = jest.spyOn(webhookService as any, 'processQueue');
    (webhookService as any).startQueueProcessing();
    jest.advanceTimersByTime(500);
    expect(processQueueSpy).toHaveBeenCalled();
  });

  it('stopQueueProcessing clears the interval', () => {
    (webhookService as any).intervalId = setInterval(() => {}, 500);
    const intervalId = (webhookService as any).intervalId;
    (webhookService as any).stopQueueProcessing();
    expect(clearInterval).toHaveBeenCalledWith(intervalId);
  });
});