import { Job, Queue } from 'bullmq';
import { mock } from 'vitest-mock-extended';
import WebhookWorker from './webhookWorker';
import { processWebhookJob } from './webhookProcessing';
import { createWebhook, getWebhook } from './webhook.service';
import {  Webhook } from '../types/webhook';
import { Redis } from 'ioredis';

// Mock the bullmq Queue and Job types
vi.mock('bullmq', async (importOriginal) => {  
  const actual = await importOriginal();
  return {
    ...actual,
    Queue: class MockQueue extends actual.Queue {
      add = vi.fn();
      close = vi.fn();
    },
    Job: class MockJob extends actual.Job {
      data: any;
      id: string;
      constructor(queue: any, id: string, data: any) {
        super(queue, id, data);
        this.data = data;
        this.id = id;
      }
      async isFailed() {
        return false;
      }
      async remove() {
        return;
      }
    },
  };
});

// Mock the webhookService
vi.mock('./webhook.service');


describe('WebhookWorker', () => {
  let webhookQueue: Queue;
  let webhookWorker: WebhookWorker;
  const mockWebhook: Webhook = {
      id: '1',
      url: 'http://example.com',
      events: ['issue.created'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
  }

  beforeEach(async () => {
    // Initialize queue and worker
    webhookQueue = new (require('bullmq').Queue)('webhookQueue', { connection: { host: 'localhost', port: 6379 } });
    webhookWorker = new WebhookWorker(webhookQueue);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await webhookQueue.close();
  });

  it('should add a job to the queue', async () => {
    const addSpy = vi.spyOn(webhookQueue, 'add');
    const jobData = { url: 'http://example.com', data: { issue: { id: '123' } }, webhookId: '123', event: 'issue.created' };
    await webhookQueue.add('webhookJob', jobData);
    expect(addSpy).toHaveBeenCalledWith('webhookJob', jobData);
  });

  it('should process a successful webhook job', async () => {
    const mockJob = new (require('bullmq').Job)(webhookQueue, '1', { url: 'http://example.com', data: { issue: { id: '123' } }, webhookId: '123', event: 'issue.created' });
    const axiosPostSpy = vi.spyOn(require('axios'), 'post').mockResolvedValue({ status: 200 });
    await webhookWorker.process(mockJob);
    expect(axiosPostSpy).toHaveBeenCalledWith('http://example.com', { issue: { id: '123' } }, expect.anything());
  });

  it('should handle a failed webhook request', async () => {
    const mockJob = new (require('bullmq').Job)(webhookQueue, '1', { url: 'http://example.com', data: { issue: { id: '123' } }, webhookId: '123', event: 'issue.created' });
    const axiosPostSpy = vi.spyOn(require('axios'), 'post').mockRejectedValue(new Error('Network Error'));
    await webhookWorker.process(mockJob);
    expect(axiosPostSpy).toHaveBeenCalledWith('http://example.com', { issue: { id: '123' } }, expect.anything());
  });

  it('should handle network errors', async () => {
    const mockJob = new (require('bullmq').Job)(webhookQueue, '1', { url: 'http://example.com', data: { issue: { id: '123' } }, webhookId: '123', event: 'issue.created' });
    const axiosPostSpy = vi.spyOn(require('axios'), 'post').mockRejectedValue(new Error('Network Error'));
    await webhookWorker.process(mockJob);
    expect(axiosPostSpy).toHaveBeenCalledWith('http://example.com', { issue: { id: '123' } }, expect.anything());
  });

  it('should handle timeout errors', async () => {
    const mockJob = new (require('bullmq').Job)(webhookQueue, '1', { url: 'http://example.com', data: { issue: { id: '123' } }, webhookId: '123', event: 'issue.created' });
    const axiosPostSpy = vi.spyOn(require('axios'), 'post').mockRejectedValue(new Error('timeout'));
    await webhookWorker.process(mockJob);
    expect(axiosPostSpy).toHaveBeenCalledWith('http://example.com', { issue: { id: '123' } }, expect.anything());
  });

  it('should log job completion on success', async () => {
    const mockJob = new (require('bullmq').Job)(webhookQueue, '1', { url: 'http://example.com', data: { issue: { id: '123' } }, webhookId: '123', event: 'issue.created' });
    const consoleLogSpy = vi.spyOn(console, 'log');
    const axiosPostSpy = vi.spyOn(require('axios'), 'post').mockResolvedValue({ status: 200 });
    await webhookWorker.process(mockJob);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Job 1 completed'));
  });

  it('should log job failure on error', async () => {
    const mockJob = new (require('bullmq').Job)(webhookQueue, '1', { url: 'http://example.com', data: { issue: { id: '123' } }, webhookId: '123', event: 'issue.created' });
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const axiosPostSpy = vi.spyOn(require('axios'), 'post').mockRejectedValue(new Error('Network Error'));
    await webhookWorker.process(mockJob);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Job 1 failed with error'));
  });
});