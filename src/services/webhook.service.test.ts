import { WebhookService, enqueueWebhook, processWebhook, getDeadLetterQueue, getWebhookQueueSize } from './webhook.service';
import { WebhookPayload } from '../../types/webhook';
import { ConfigService } from '../../config/config.service'; // Corrected path
import logger from '../../utils/logger'; // Corrected path
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../../utils/logger'); // Corrected path
jest.mock('../../config/config.service'); // Corrected path

describe('WebhookService', () => {
    let service: WebhookService;
    let configService: jest.Mocked<ConfigService>;
    let loggerSpy: any;

    beforeEach(async () => {
        configService = {
            get: jest.fn().mockImplementation((key: string) => {
                if (key === 'webhook.url') {
                    return 'http://example.com/webhook';
                }
                return undefined;
            }),
        } as jest.Mocked<ConfigService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebhookService,
                { provide: ConfigService, useValue: configService },
            ],
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

        const consoleLogSpy = jest.spyOn(console, 'log');
        enqueueWebhook(payload);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Enqueuing webhook with payload:'));
        consoleLogSpy.mockRestore();
    });

    it('should process a webhook', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log');
        await processWebhook('http://example.com/webhook');
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Processing webhook for URL:'));
        consoleLogSpy.mockRestore();
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