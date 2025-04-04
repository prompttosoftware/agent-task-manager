// src/services/webhook.worker.test.ts
import { Job, Queue } from 'bullmq';
import { mock } from 'vitest-mock-extended';
import { WebhookWorker } from './webhookWorker';
import { processWebhookJob } from './webhookProcessing';
import axios from 'axios';
import { logger } from '../config';

vi.mock('axios');
vi.mock('./webhookProcessing');

describe('WebhookWorker', () => {
  let webhookQueue: Queue;
  let webhookWorker: WebhookWorker;

  beforeEach(() => {
    // Initialize queue and worker
    webhookQueue = new Queue('webhookQueue', { connection: { host: 'localhost', port: 6379 } }); // Provide a mock connection
    webhookWorker = new WebhookWorker(webhookQueue);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up the queue after each test
    await webhookQueue.obliterate({ force: true });
  });

  it('should add a job to the queue', async () => {
    const addSpy = vi.spyOn(webhookQueue, 'add');
    await webhookQueue.add('webhookJob', { url: 'http://example.com', payload: { data: 'test' } });
    expect(addSpy).toHaveBeenCalledWith('webhookJob', { url: 'http://example.com', payload: { data: 'test' } });
  });

  it('should process a successful webhook job', async () => {
    const mockAxios = axios as any;
    const mockResponse = { status: 200, data: { message: 'success' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const job = { data: { url: 'http://example.com', payload: { data: 'test' } } } as any;
    const processWebhookJobMock = vi.mocked(processWebhookJob);
    processWebhookJobMock.mockResolvedValue(undefined);

    await processWebhookJob(job.data.url, job.data.payload);

    expect(mockAxios.post).toHaveBeenCalledWith(job.data.url, job.data.payload);
    expect(processWebhookJobMock).toHaveBeenCalledWith(job.data.url, job.data.payload);
  });

  it('should handle a failed webhook request', async () => {
    const mockAxios = axios as any;
    mockAxios.post.mockRejectedValue(new Error('Request failed'));

    const job = { data: { url: 'http://example.com', payload: { data: 'test' } } } as any;
    const processWebhookJobMock = vi.mocked(processWebhookJob);
    processWebhookJobMock.mockRejectedValue(new Error('Request failed'));

    await expect(processWebhookJob(job.data.url, job.data.payload)).rejects.toThrow('Request failed');

    expect(mockAxios.post).toHaveBeenCalledWith(job.data.url, job.data.payload);
    expect(processWebhookJobMock).toHaveBeenCalledWith(job.data.url, job.data.payload);
  });

  it('should handle network errors', async () => {
    const mockAxios = axios as any;
    mockAxios.post.mockRejectedValue(new Error('Network Error'));

    const job = { data: { url: 'http://example.com', payload: { data: 'test' } } } as any;
    const processWebhookJobMock = vi.mocked(processWebhookJob);
    processWebhookJobMock.mockRejectedValue(new Error('Network Error'));

    await expect(processWebhookJob(job.data.url, job.data.payload)).rejects.toThrow('Network Error');

    expect(mockAxios.post).toHaveBeenCalledWith(job.data.url, job.data.payload);
    expect(processWebhookJobMock).toHaveBeenCalledWith(job.data.url, job.data.payload);
  });

  it('should handle timeout errors', async () => {
    const mockAxios = axios as any;
    mockAxios.post.mockRejectedValue(new Error('Timeout exceeded'));

    const job = { data: { url: 'http://example.com', payload: { data: 'test' } } } as any;
    const processWebhookJobMock = vi.mocked(processWebhookJob);
    processWebhookJobMock.mockRejectedValue(new Error('Timeout exceeded'));

    await expect(processWebhookJob(job.data.url, job.data.payload)).rejects.toThrow('Timeout exceeded');

    expect(mockAxios.post).toHaveBeenCalledWith(job.data.url, job.data.payload);
    expect(processWebhookJobMock).toHaveBeenCalledWith(job.data.url, job.data.payload);
  });

  it('should log job completion on success', async () => {
    const mockAxios = axios as any;
    const mockResponse = { status: 200, data: { message: 'success' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const job = { data: { url: 'http://example.com', payload: { data: 'test' } } } as any;
    const processWebhookJobMock = vi.mocked(processWebhookJob);
    processWebhookJobMock.mockResolvedValue(undefined);

    await processWebhookJob(job.data.url, job.data.payload);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Webhook job completed successfully'),
    );
  });

  it('should log job failure on error', async () => {
    const mockAxios = axios as any;
    mockAxios.post.mockRejectedValue(new Error('Request failed'));

    const job = { data: { url: 'http://example.com', payload: { data: 'test' } } } as any;
    const processWebhookJobMock = vi.mocked(processWebhookJob);
    processWebhookJobMock.mockRejectedValue(new Error('Request failed'));

    try {
      await processWebhookJob(job.data.url, job.data.payload);
    } catch (error) {
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Webhook job failed'),
      );
    }
  });
});