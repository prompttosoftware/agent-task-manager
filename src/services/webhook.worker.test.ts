import { Test, TestingModule } from '@nestjs/testing';
import { WebhookWorker } from './webhookWorker';
import { WebhookService } from '../src/services/webhook.service';
import { WebhookQueue } from '../src/services/webhookQueue';
import { Logger } from '../src/api/utils/logger';

// Mock dependencies
jest.mock('../src/services/webhook.service');
jest.mock('../src/services/webhookQueue');
jest.mock('../src/api/utils/logger');

describe('WebhookWorker', () => {
  let worker: WebhookWorker;
  let webhookService: WebhookService;
  let webhookQueue: WebhookQueue;
  let logger: Logger;

  beforeEach(async () => {
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

  it('should handle errors during webhook processing', async () => {
    const job = { data: { webhookId: '1', payload: { event: 'issue.created', data: { issue: { key: 'TEST-1' } } } } };
    const errorMessage = 'Failed to process webhook';
    (webhookService.handleWebhook as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await worker.process(job);

    expect(logger.error).toHaveBeenCalledWith('Error processing webhook', expect.objectContaining({ message: errorMessage }));
  });
});