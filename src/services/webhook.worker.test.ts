import { Test, TestingModule } from '@nestjs/testing';
import { WebhookWorker } from './webhookWorker';
import { WebhookService } from '../src/services/webhook.service';
import { WebhookQueue } from '../src/services/webhookQueue';
import { Logger } from '../src/api/utils/logger';
import { vi } from 'vitest';

describe('WebhookWorker', () => {
  let worker: WebhookWorker;
  let webhookService: WebhookService;
  let webhookQueue: WebhookQueue;
  let logger: Logger;

  beforeEach(async () => {
    // Mock environment variables BEFORE creating the module
    vi.stubEnv({
        WEBHOOK_URL: 'http://localhost:3000/webhook',
        QUEUE_NAME: 'test_queue',
        LOG_LEVEL: 'debug'
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookWorker,
        WebhookService,
        WebhookQueue,
        Logger,
      ],
    }).compile();

    worker = module.get<WebhookWorker>(WebhookWorker);
    webhookService = module.get<WebhookService>(WebhookService);
    webhookQueue = module.get<WebhookQueue>(WebhookQueue);
    logger = module.get<Logger>(Logger);
    jest.clearAllMocks();
  });

  afterEach(() => {
      vi.unstubAllEnvs();
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
    expect(webhookService).toBeDefined();
    expect(webhookQueue).toBeDefined();
    expect(logger).toBeDefined();
  });

  it('should process a webhook job successfully', async () => {
    const job = { data: { webhookId: '1', payload: { event: 'issue.created', data: { issue: { key: 'TEST-1' } } } } };
    const mockHandleWebhookResult = { status: 200 };
    (webhookService.handleWebhook as jest.Mock).mockResolvedValue(mockHandleWebhookResult);

    await worker.process(job);

    expect(webhookService.handleWebhook).toHaveBeenCalledWith(job.data.payload, undefined);
    expect(logger.info).toHaveBeenCalledWith('Webhook processed successfully', { webhookId: '1', status: 200 });
  });

  it('should handle API errors during webhook processing', async () => {
      const job = { data: { webhookId: '1', payload: { event: 'issue.created', data: { issue: { key: 'TEST-1' } } } } };
      const apiError = new Error('API Error');

      // Use vi.spyOn to mock the handleWebhook method and simulate an API error.
      const handleWebhookSpy = vi.spyOn(webhookService, 'handleWebhook').mockRejectedValue(apiError);

      await worker.process(job);

      expect(handleWebhookSpy).toHaveBeenCalledWith(job.data.payload, undefined); // Verify correct arguments
      expect(logger.error).toHaveBeenCalledWith('Error processing webhook', expect.objectContaining({ message: 'API Error' }));

      handleWebhookSpy.mockRestore(); // Restore the original method after the test. Crucial!
  });

  it('should handle webhook successfully with a specific response', async () => {
    const job = { data: { webhookId: '1', payload: { event: 'issue.created', data: { issue: { key: 'TEST-1' } } } } };
    const mockResponse = { status: 202, data: { message: 'Accepted' } };
    const handleWebhookSpy = vi.spyOn(webhookService, 'handleWebhook').mockResolvedValue(mockResponse);

    await worker.process(job);

    expect(handleWebhookSpy).toHaveBeenCalledWith(job.data.payload, undefined);
    expect(logger.info).toHaveBeenCalledWith('Webhook processed successfully', { webhookId: '1', status: 202 });
    handleWebhookSpy.mockRestore();
  });

  it('should handle errors during webhook processing', async () => {
    const job = { data: { webhookId: '1', payload: { event: 'issue.created', data: { issue: { key: 'TEST-1' } } } } };
    const errorMessage = 'Failed to process webhook';
    (webhookService.handleWebhook as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await worker.process(job);

    expect(logger.error).toHaveBeenCalledWith('Error processing webhook', expect.objectContaining({ message: errorMessage }));
  });
});