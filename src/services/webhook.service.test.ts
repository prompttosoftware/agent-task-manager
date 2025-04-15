import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService, enqueueWebhook, processWebhook, getDeadLetterQueue, getWebhookQueueSize } from './webhook.service';
import { WebhookPayload } from '../../types/webhook';
import { RegisterWebhookRequest } from './webhook.service';
import logger from '../../utils/logger';
import { ConfigService } from '../../config/config.service';

// Mock the dependencies
jest.mock('../../utils/logger');
jest.mock('../../config/config.service');

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookService, ConfigService],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should enqueue a webhook', () => {
    const payload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } },
    };
    enqueueWebhook(payload);
    // Add assertions to check if enqueueWebhook calls the correct functions or updates state correctly
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Enqueuing webhook with payload:'));
  });

  it('should process a webhook', async () => {
    const webhookUrl = 'http://example.com/webhook';
    await processWebhook(webhookUrl);

    // Add assertions to check if processWebhook calls the correct functions or updates state correctly
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Processing webhook for URL:'));
  });

  it('should get dead letter queue', () => {
    const deadLetterQueue = getDeadLetterQueue();
    expect(deadLetterQueue).toEqual([]);
  });

  it('should get webhook queue size', () => {
    const queueSize = getWebhookQueueSize();
    expect(queueSize).toBe(0);
  });
});